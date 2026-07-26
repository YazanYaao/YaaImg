# YaaImg - Implementation Plan

**Version**: 1.5.0
**Date**: 2026-07-09
**Status**: Approved

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Key Decisions](#key-decisions)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Platform Presets](#platform-presets)
6. [Brand Kit Interview](#brand-kit-interview)
7. [API Endpoints](#api-endpoints)
8. [Generation Pipeline](#generation-pipeline)
9. [Hard Delete Implementation](#hard-delete-implementation)
10. [Frontend Structure](#frontend-structure)
11. [Build Order](#build-order)
12. [Dockerization](#dockerization)
13. [Environment Variables](#environment-variables)
14. [Verification Checklist](#verification-checklist)
15. [Files to Create](#files-to-create)

---

## Executive Summary

YaaImg is a multi-brand SaaS for generating social images. Users create brands, complete a brand kit interview, add their own API keys (BYOK model), and generate images for various social platforms.

### Core Product Rules

- **Tenancy**: Brand-based (every resource belongs to exactly one brand)
- **Ownership**: One user owns brands; no sharing; owner role only
- **Billing**: None in MVP; users provide their own API keys (BYOK)
- **Output**: PNG format only
- **Providers**: OpenAI and Gemini (official endpoints only)

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preset structure | Single `platform_preset` field | Simplifies schema; format is always PNG |
| Platforms | Instagram, Facebook, Twitter/X, LinkedIn, TikTok, YouTube | Covers major social networks |
| Logo usage | Per-generation choice | Flexibility: none / prompt / watermark / both |
| Image URLs | Public (unguessable UUIDs) | Simpler for MVP; UUIDs provide practical privacy |
| Brand kit | 6 questions | Minimal viable set for brand context |
| Brand kit storage | Typed columns + derived summary | Better data integrity and easier querying than raw JSON-only |
| User profile storage | `profiles` table linked to `auth.users` | Supports editable account info without duplicating auth system |
| Provider keys | Key rotation with single active key per provider per brand | Allows safe rotation without downtime |
| Generation lifecycle | `pending`/`processing`/`succeeded`/`failed` statuses | Preserves failure history and supports ops visibility |
| Admin | Operator-only (email allowlist) | Users manage their brands; operator monitors system |
| AI Models | OpenAI `gpt-image-2` + Gemini `gemini-3-pro-image-preview` | Latest image generation models |
| Summary derivation | Template concatenation | Deterministic, fast, no extra API costs |
| History actions | View + Delete only | MVP scope; no prompt reuse |
| Processing | Synchronous (inline HTTP) | Simpler for MVP; no background worker needed |
| Real-time updates | None | No SignalR or WebSockets; client polls or waits for response |
| API routing | No versioning prefix; brand-scoped paths | `/brands/{id}/...` style for simplicity |
| Pagination | Page-based (offset/limit) | Simpler than cursor pagination for MVP |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    YaaImg Local Development                          │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Next.js 14 (App Router)                                      │   │
│  │  - Frontend application                                      │   │
│  │  - Supabase Auth (session only)                              │   │
│  │  - Public port :3000                                         │   │
│  └──────────────────┬───────────────────────────────────────────┘   │
│                     │ REST (no versioning prefix)                    │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ASP.NET Core .NET 10                                         │   │
│  │  - REST API (brand-scoped routes)                            │   │
│  │  - OpenAPI documentation                                     │   │
│  │  - Synchronous generation (inline HTTP)                      │   │
│  │  - ImageSharp (resize/crop/watermark)                        │   │
│  │  - Internal port :5000                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Supabase (Cloud)                            │
├─────────────────┬─────────────────┬──────────────┬──────────────────┤
│      Auth       │       DB        │    Vault     │   Storage        │
│  (email/pass)   │   (with RLS)    │  (secrets)   │  (public)        │
└─────────────────┴─────────────────┴──────────────┴──────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────┐
                     │    Provider APIs         │
                     │  - OpenAI (gpt-image-2)  │
                     │  - Gemini API            │
                     │    (gemini-3-pro-image-  │
                     │     preview)             │
                     └──────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Backend | ASP.NET Core .NET 10, C# |
| Auth | Supabase Auth (email/password only for MVP) |
| Database | Supabase PostgreSQL |
| Secrets | Supabase Vault |
| Storage | Supabase Storage (public bucket, unguessable UUID paths) |
| Image processing | SixLabors.ImageSharp |
| API contract | OpenAPI documentation |
| Deployment | Local development (Docker compose or native); production host TBD |
| Providers | OpenAI, Google Gemini API |

---

## Database Schema

### Schema Principles

- Use strict types/enums for domain fields (`provider`, `logo_mode`, `status`, `platform_preset`)
- Keep mutable records auditable (`created_at`, `updated_at`, status + failure fields)
- Enforce ownership and tenant isolation at both API and DB layers (RLS + server checks)
- Support operational workflows from day 1 (key rotation, failed generation records)
- Brand-based tenancy: provider keys belong to brands, not users

### Core Types and Helpers

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE provider_t AS ENUM ('openai', 'gemini');
CREATE TYPE tone_t AS ENUM ('formal', 'casual', 'playful', 'professional', 'friendly');
CREATE TYPE logo_mode_t AS ENUM ('none', 'prompt', 'watermark', 'both');
CREATE TYPE kit_status_t AS ENUM ('not_started', 'in_progress', 'complete');
CREATE TYPE generation_status_t AS ENUM ('pending', 'processing', 'succeeded', 'failed');
CREATE TYPE platform_preset_t AS ENUM (
  'instagram_post', 'instagram_story', 'instagram_reel_cover',
  'facebook_post', 'facebook_cover', 'facebook_story',
  'twitter_post', 'twitter_header',
  'linkedin_post', 'linkedin_banner',
  'tiktok_video_cover',
  'youtube_thumbnail', 'youtube_banner'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION all_hex_colors(color_values TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(bool_and(v ~* '^#[0-9A-F]{6}$'), TRUE)
  FROM unnest(color_values) AS t(v);
$$;
```

### Tables

#### 1. profiles

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT CHECK (
    full_name IS NULL OR char_length(btrim(full_name)) BETWEEN 2 AND 120
  ),
  avatar_url TEXT CHECK (
    avatar_url IS NULL OR avatar_url ~ '^https?://.+'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 2. brands

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  logo_path TEXT CHECK (
    logo_path IS NULL
    OR logo_path ~ '^brands/[0-9a-f-]+/logo\.[A-Za-z0-9]+$'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_brands_owner_name_ci
  ON brands(owner_user_id, lower(name));
CREATE INDEX idx_brands_owner_created
  ON brands(owner_user_id, created_at DESC);
```

#### 3. brand_kits

```sql
CREATE TABLE brand_kits (
  brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  tagline TEXT CHECK (tagline IS NULL OR char_length(tagline) <= 160),
  tone tone_t,
  audience TEXT CHECK (audience IS NULL OR char_length(btrim(audience)) BETWEEN 2 AND 500),
  colors TEXT[] NOT NULL DEFAULT '{}',
  avoid_words TEXT,
  summary TEXT,
  status kit_status_t NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cardinality(colors) <= 3),
  CHECK (all_hex_colors(colors)),
  CHECK (
    status <> 'complete'
    OR (tone IS NOT NULL AND audience IS NOT NULL AND cardinality(colors) >= 1)
  ),
  CHECK (
    (status = 'complete' AND completed_at IS NOT NULL)
    OR (status <> 'complete' AND completed_at IS NULL)
  )
);
```

#### 4. provider_keys

```sql
CREATE TABLE provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  provider provider_t NOT NULL,
  vault_secret_id UUID NOT NULL,
  label TEXT CHECK (label IS NULL OR char_length(label) <= 100),
  key_hint TEXT CHECK (key_hint IS NULL OR key_hint ~ '^[A-Za-z0-9_-]{2,16}$'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_valid BOOLEAN,
  last_validated_at TIMESTAMPTZ,
  last_validation_error TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one active key per brand/provider, while still allowing historical keys.
CREATE UNIQUE INDEX uq_provider_keys_one_active
  ON provider_keys(brand_id, provider)
  WHERE is_active;

CREATE INDEX idx_provider_keys_lookup
  ON provider_keys(brand_id, provider, created_at DESC);
```

#### 5. generations

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL CHECK (char_length(btrim(prompt)) BETWEEN 3 AND 4000),
  provider provider_t NOT NULL,
  model TEXT NOT NULL CHECK (char_length(model) BETWEEN 3 AND 100),
  platform_preset platform_preset_t NOT NULL,
  width INT NOT NULL CHECK (width BETWEEN 256 AND 4096),
  height INT NOT NULL CHECK (height BETWEEN 256 AND 4096),
  logo_mode logo_mode_t NOT NULL DEFAULT 'none',
  status generation_status_t NOT NULL DEFAULT 'pending',
  provider_request_id TEXT,
  image_path TEXT CHECK (
    image_path IS NULL
    OR image_path ~ '^brands/[0-9a-f-]+/generations/[0-9a-f-]+\.png$'
  ),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK (
    (status = 'succeeded'
      AND image_path IS NOT NULL
      AND error_code IS NULL
      AND error_message IS NULL
      AND completed_at IS NOT NULL)
    OR
    (status = 'failed'
      AND image_path IS NULL
      AND error_code IS NOT NULL
      AND completed_at IS NOT NULL)
    OR
    (status IN ('pending', 'processing')
      AND image_path IS NULL
      AND error_code IS NULL
      AND error_message IS NULL
      AND completed_at IS NULL)
  )
);

CREATE INDEX idx_generations_brand_created
  ON generations(brand_id, created_at DESC);
CREATE INDEX idx_generations_brand_status_created
  ON generations(brand_id, status, created_at DESC);
CREATE INDEX idx_generations_brand_provider_created
  ON generations(brand_id, provider, created_at DESC);
```

### Triggers

```sql
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_provider_keys_updated_at
  BEFORE UPDATE ON provider_keys
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### Row Level Security (RLS)

All tenant tables enforce ownership. Enable and force RLS on every table.

```sql
CREATE OR REPLACE FUNCTION is_brand_owner(p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM brands b
    WHERE b.id = p_brand_id
      AND b.owner_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION is_brand_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_brand_owner(UUID) TO authenticated;

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands FORCE ROW LEVEL SECURITY;

CREATE POLICY brands_select ON brands FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY brands_insert ON brands FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY brands_update ON brands FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY brands_delete ON brands FOR DELETE
  USING (owner_user_id = auth.uid());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_owner_all ON profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits FORCE ROW LEVEL SECURITY;

CREATE POLICY brand_kits_owner_all ON brand_kits FOR ALL
  USING (is_brand_owner(brand_id))
  WITH CHECK (is_brand_owner(brand_id));

ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY provider_keys_owner_all ON provider_keys FOR ALL
  USING (is_brand_owner(brand_id))
  WITH CHECK (is_brand_owner(brand_id));

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations FORCE ROW LEVEL SECURITY;

CREATE POLICY generations_owner_all ON generations FOR ALL
  USING (is_brand_owner(brand_id))
  WITH CHECK (is_brand_owner(brand_id));
```

`SUPABASE_SECRET_KEY` bypasses RLS and is backend-only.

### Storage

- **Bucket**: `brand-assets` (public)
- **Paths**:
  - `brands/{brandId}/logo.{ext}` — Brand logo
  - `brands/{brandId}/generations/{generationId}.png` — Generated image (`status = succeeded` only)

---

## Platform Presets

```typescript
export const PLATFORM_PRESETS = {
  // Instagram
  instagram_post: { width: 1080, height: 1080, label: 'Instagram Post' },
  instagram_story: { width: 1080, height: 1920, label: 'Instagram Story' },
  instagram_reel_cover: { width: 1080, height: 1920, label: 'Instagram Reel Cover' },

  // Facebook
  facebook_post: { width: 1200, height: 630, label: 'Facebook Post' },
  facebook_cover: { width: 820, height: 312, label: 'Facebook Cover' },
  facebook_story: { width: 1080, height: 1920, label: 'Facebook Story' },

  // Twitter/X
  twitter_post: { width: 1200, height: 675, label: 'Twitter Post' },
  twitter_header: { width: 1500, height: 500, label: 'Twitter Header' },

  // LinkedIn
  linkedin_post: { width: 1200, height: 627, label: 'LinkedIn Post' },
  linkedin_banner: { width: 1584, height: 396, label: 'LinkedIn Banner' },

  // TikTok
  tiktok_video_cover: { width: 1080, height: 1920, label: 'TikTok Video Cover' },

  // YouTube
  youtube_thumbnail: { width: 1280, height: 720, label: 'YouTube Thumbnail' },
  youtube_banner: { width: 2560, height: 1440, label: 'YouTube Banner' },
} as const;

export type PlatformPreset = keyof typeof PLATFORM_PRESETS;
```

### Grouped by Platform (for UI)

```typescript
export const PRESETS_BY_PLATFORM = {
  instagram: ['instagram_post', 'instagram_story', 'instagram_reel_cover'],
  facebook: ['facebook_post', 'facebook_cover', 'facebook_story'],
  twitter: ['twitter_post', 'twitter_header'],
  linkedin: ['linkedin_post', 'linkedin_banner'],
  tiktok: ['tiktok_video_cover'],
  youtube: ['youtube_thumbnail', 'youtube_banner'],
} as const;
```

### Aspect Ratio Mapping (for Gemini)

Gemini API requires `aspect_ratio` instead of explicit width/height. Map presets to closest supported ratio:

```typescript
export const PRESET_TO_ASPECT_RATIO: Record<PlatformPreset, string> = {
  // 1:1
  instagram_post: '1:1',

  // 9:16 (vertical)
  instagram_story: '9:16',
  instagram_reel_cover: '9:16',
  facebook_story: '9:16',
  tiktok_video_cover: '9:16',

  // 16:9 (horizontal)
  facebook_post: '16:9',
  twitter_post: '16:9',
  linkedin_post: '16:9',
  youtube_thumbnail: '16:9',

  // 3:1 (wide banners - use 16:9 and crop)
  twitter_header: '16:9',
  facebook_cover: '16:9',
  linkedin_banner: '16:9',
  youtube_banner: '16:9',
};
```

---

## Brand Kit Interview

### Questions (6 Standard Set)

| # | Field | Question | Type | Required |
|---|-------|----------|------|----------|
| 1 | `name` | What is your brand name? (stored in `brands.name`) | text | Yes |
| 2 | `tagline` | What is your brand's tagline or slogan? | text | No |
| 3 | `tone` | What tone should your content have? | select | Yes |
| 4 | `audience` | Who is your target audience? | text | Yes |
| 5 | `colors` | What are your brand's primary colors? | color picker (up to 3) | Yes |
| 6 | `avoid_words` | Are there any words or themes to avoid? | text | No |

### Tone Options

- `formal` — Professional and business-like
- `casual` — Relaxed and conversational
- `playful` — Fun and lighthearted
- `professional` — Expert and authoritative
- `friendly` — Warm and approachable

### Summary Derivation Template

```csharp
public static class BrandSummaryBuilder
{
    public static string DeriveSummary(string brandName, BrandKitAnswers answers)
    {
        var lines = new[]
        {
            $"Brand: {brandName}",
            $"Tagline: {answers.Tagline ?? "None specified"}",
            $"Tone: {answers.Tone}",
            $"Audience: {answers.Audience}",
            $"Colors: {string.Join(", ", answers.Colors)}",
            $"Avoid: {answers.AvoidWords ?? "None specified"}"
        };
        return string.Join("\n", lines);
    }
}
```

### Status Transitions

```
not_started → in_progress → complete
     │              │
     └──────────────┘ (can go back to edit)
```

- `not_started`: No answers saved yet
- `in_progress`: Some answers saved, not all required fields complete
- `complete`: All required fields have values

---

## API Endpoints

### Authentication

All endpoints (except `/health`) require a valid Supabase JWT in the `Authorization` header.

```
Authorization: Bearer <supabase_access_token>
```

### Error Response Format

Uses Problem Details (RFC 9457):

```json
{
  "type": "https://yaaimg.com/errors/brand-not-found",
  "title": "Brand Not Found",
  "status": 404,
  "detail": "The specified brand does not exist or you do not have access.",
  "traceId": "00-abc123-def456-01",
  "errorCode": "BRAND_NOT_FOUND"
}
```

### Endpoints

#### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (no auth) |

#### Account/Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update current user profile |

**Update Profile Request**:
```json
{
  "full_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.png"
}
```

**Profile Response**:
```json
{
  "user_id": "uuid",
  "email": "jane@example.com",
  "full_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.png",
  "created_at": "2026-01-28T00:00:00Z",
  "updated_at": "2026-01-28T00:00:00Z"
}
```

#### Brands

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands` | List user's brands |
| POST | `/brands` | Create a new brand |
| GET | `/brands/{id}` | Get brand details |
| DELETE | `/brands/{id}` | Hard delete brand (cascades) |
| POST | `/brands/{id}/logo` | Upload brand logo |
| DELETE | `/brands/{id}/logo` | Delete brand logo |

**Create Brand Request**:
```json
{
  "name": "My Brand"
}
```

**Brand Response**:
```json
{
  "id": "uuid",
  "name": "My Brand",
  "logo_url": "https://xxx.supabase.co/storage/v1/object/public/brand-assets/brands/uuid/logo.png",
  "kit_status": "not_started",
  "created_at": "2026-01-28T00:00:00Z"
}
```

#### Brand Kit

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands/{id}/kit` | Get brand kit |
| PUT | `/brands/{id}/kit` | Upsert brand kit answers |

**Upsert Kit Request**:
```json
{
  "name": "My Brand",
  "answers": {
    "tagline": "Innovation for everyone",
    "tone": "professional",
    "audience": "Small business owners aged 25-45",
    "colors": ["#FF5733", "#3498DB", "#2ECC71"],
    "avoid_words": "cheap, discount, budget"
  }
}
```

**Kit Response**:
```json
{
  "brand_id": "uuid",
  "brand_name": "My Brand",
  "answers": {
    "tagline": "Innovation for everyone",
    "tone": "professional",
    "audience": "Small business owners aged 25-45",
    "colors": ["#FF5733", "#3498DB", "#2ECC71"],
    "avoid_words": "cheap, discount, budget"
  },
  "summary": "Brand: My Brand\nTagline: Innovation for everyone\n...",
  "status": "complete",
  "completed_at": "2026-01-28T00:00:00Z",
  "updated_at": "2026-01-28T00:00:00Z"
}
```

#### Provider Keys

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brands/{id}/keys` | List keys for brand |
| POST | `/brands/{id}/keys` | Add a provider key |
| PATCH | `/brands/{id}/keys/{keyId}/activate` | Activate key (deactivates prior active key for provider) |
| POST | `/brands/{id}/keys/{keyId}/validate` | Validate a key |
| DELETE | `/brands/{id}/keys/{keyId}` | Delete a key |

**Add Key Request**:
```json
{
  "provider": "openai",
  "key": "sk-...",
  "label": "Production Key",
  "make_active": true
}
```

**Key Response** (key value never returned):
```json
{
  "id": "uuid",
  "provider": "openai",
  "label": "Production Key",
  "key_hint": "***A1B2",
  "is_active": true,
  "is_valid": true,
  "last_validated_at": "2026-01-28T00:00:00Z",
  "last_validation_error": null,
  "created_at": "2026-01-28T00:00:00Z"
}
```

**Validate Response**:
```json
{
  "valid": true,
  "validated_at": "2026-01-28T00:00:00Z",
  "error": null,
  "key_id": "uuid"
}
```

#### Generations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/brands/{id}/generate` | Generate an image (synchronous) |
| GET | `/brands/{id}/generations` | List generations (page-based) |
| GET | `/brands/{id}/generations/{genId}` | Get generation details |
| DELETE | `/brands/{id}/generations/{genId}` | Hard delete generation |

**Generate Request**:
```json
{
  "prompt": "A modern office space with natural lighting",
  "provider": "openai",
  "model": "gpt-image-2",
  "platform_preset": "instagram_post",
  "logo_mode": "watermark"
}
```

**Generate Response**:
```json
{
  "id": "uuid",
  "prompt": "A modern office space with natural lighting",
  "provider": "openai",
  "model": "gpt-image-2",
  "platform_preset": "instagram_post",
  "width": 1080,
  "height": 1080,
  "logo_mode": "watermark",
  "status": "succeeded",
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/brand-assets/brands/uuid/generations/uuid.png",
  "error_code": null,
  "created_at": "2026-01-28T00:00:00Z",
  "completed_at": "2026-01-28T00:00:03Z"
}
```

**List Generations Query Params**:
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `provider` (optional filter: `openai` | `gemini`)
- `status` (optional filter: `pending` | `processing` | `succeeded` | `failed`)

#### Admin (Operator Only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/brands` | List all brands with counts |
| GET | `/admin/stats` | Basic usage statistics |

Gated by `ADMIN_EMAILS` environment variable.

---

## Generation Pipeline

Generation is **synchronous**. The entire flow runs inline within the HTTP request — the client waits for the response.

```csharp
public class GenerationService
{
    public async Task<GenerationResponse> GenerateImageAsync(
        Guid brandId,
        GenerateRequest request,
        ClaimsPrincipal user,
        CancellationToken ct)
    {
        // 1. Verify brand ownership
        var userId = user.GetUserId();
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
            throw new NotFoundException("Brand not found");

        // 2. Resolve preset dimensions
        var preset = PlatformPresets.Get(request.PlatformPreset);
        var targetWidth = preset.Width;
        var targetHeight = preset.Height;

        // 3. Fetch active key
        var key = await _keyRepository.GetActiveAsync(brandId, request.Provider, ct);
        if (key is null)
            throw new ValidationException($"No {request.Provider} key configured for this brand");

        // 4. Insert generation row as pending
        var generationId = Guid.NewGuid();
        var generation = new Generation
        {
            Id = generationId,
            BrandId = brandId,
            Prompt = request.Prompt,
            Provider = request.Provider,
            Model = request.Model ?? DefaultModelFor(request.Provider),
            PlatformPreset = request.PlatformPreset,
            Width = targetWidth,
            Height = targetHeight,
            LogoMode = request.LogoMode,
            Status = GenerationStatus.Pending
        };
        await _generationRepository.InsertAsync(generation, ct);

        try
        {
            // 5. Mark processing
            await _generationRepository.UpdateStatusAsync(generationId, GenerationStatus.Processing, ct);

            // 6. Get brand kit
            var kit = await _brandKitRepository.GetByBrandIdAsync(brandId, ct);

            // 7. Build full prompt
            var promptParts = new List<string>();
            if (kit?.Summary is not null)
                promptParts.Add($"Brand Context:\n{kit.Summary}");

            if (request.LogoMode is LogoMode.Prompt or LogoMode.Both && brand.LogoPath is not null)
                promptParts.Add("Incorporate the brand logo naturally into the image.");

            promptParts.Add($"Image Request:\n{request.Prompt}");
            var fullPrompt = string.Join("\n\n", promptParts);

            // 8. Retrieve API key from Vault
            var apiKey = await _vaultService.GetSecretAsync(key.VaultSecretId, ct);

            // 9. Call provider
            ProviderResult result;
            if (request.Provider == Provider.OpenAI)
            {
                result = await _openAiProvider.GenerateAsync(
                    apiKey, fullPrompt, targetWidth, targetHeight,
                    request.Model ?? "gpt-image-2", ct);
            }
            else
            {
                var aspectRatio = PlatformPresets.GetAspectRatio(request.PlatformPreset);
                result = await _geminiProvider.GenerateAsync(
                    apiKey, fullPrompt, aspectRatio, "1K",
                    request.Model ?? "gemini-3-pro-image-preview", ct);
            }
            apiKey = null; // Release key reference immediately

            // 10. Resize/crop to exact preset dimensions
            var imageBytes = _imageProcessor.ResizeToPreset(
                result.ImageBytes, targetWidth, targetHeight);

            // 11. Apply watermark if requested
            if (request.LogoMode is LogoMode.Watermark or LogoMode.Both && brand.LogoPath is not null)
            {
                var logoBytes = await _storageService.DownloadAsync(brand.LogoPath, ct);
                imageBytes = _imageProcessor.ApplyWatermark(imageBytes, logoBytes);
            }

            // 12. Store PNG to Supabase Storage
            var imagePath = $"brands/{brandId}/generations/{generationId}.png";
            await _storageService.UploadAsync(imagePath, imageBytes, "image/png", ct);

            // 13. Mark succeeded
            await _generationRepository.MarkSucceededAsync(
                generationId, imagePath, result.RequestId, ct);

            // 14. Update key last_used_at
            await _keyRepository.MarkUsedAsync(key.Id, ct);

            // 15. Return response
            return _mapper.ToResponse(
                await _generationRepository.GetByIdAsync(generationId, ct),
                _storageService.GetPublicUrl(imagePath));
        }
        catch (ProviderException ex)
        {
            await _generationRepository.MarkFailedAsync(
                generationId, ex.ErrorCode, ex.Message[..Math.Min(ex.Message.Length, 1000)], ct);

            throw new ProblemDetailsException(502, "PROVIDER_ERROR",
                $"{request.Provider} generation failed");
        }
    }
}
```

### Provider Integration

#### OpenAI (gpt-image-2)

```csharp
public class OpenAiImageProvider : IImageProvider
{
    public async Task<ProviderResult> GenerateAsync(
        string apiKey,
        string prompt,
        int width,
        int height,
        string model,
        CancellationToken ct)
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(120);
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            model,
            prompt,
            size = $"{width}x{height}",
            response_format = "b64_json",
            n = 1
        };

        var response = await client.PostAsJsonAsync(
            "https://api.openai.com/v1/images/generations",
            payload, ct);

        response.EnsureSuccessStatusCode();

        var data = await response.Content
            .ReadFromJsonAsync<OpenAiResponse>(ct);

        return new ProviderResult
        {
            ImageBytes = Convert.FromBase64String(data!.Data[0].B64Json),
            RequestId = response.Headers.TryGetValues("x-request-id", out var vals)
                ? vals.FirstOrDefault() : null
        };
    }
}
```

#### Gemini (gemini-3-pro-image-preview)

```csharp
public class GeminiImageProvider : IImageProvider
{
    public async Task<ProviderResult> GenerateAsync(
        string apiKey,
        string prompt,
        string aspectRatio,
        string imageSize,
        string model,
        CancellationToken ct)
    {
        using var client = new HttpClient();
        client.Timeout = TimeSpan.FromSeconds(120);
        client.DefaultRequestHeaders.Add("x-goog-api-key", apiKey);

        var payload = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new
            {
                responseModalities = new[] { "Image" },
                imageConfig = new
                {
                    aspectRatio,
                    imageSize
                }
            }
        };

        var response = await client.PostAsJsonAsync(
            $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            payload, ct);

        response.EnsureSuccessStatusCode();

        var data = await response.Content
            .ReadFromJsonAsync<GeminiResponse>(ct);

        var imagePart = data!.Candidates[0].Content.Parts
            .FirstOrDefault(p => p.InlineData is not null);

        if (imagePart?.InlineData is null)
            throw new ProviderException("GEMINI_NO_IMAGE", "No image data in Gemini response");

        return new ProviderResult
        {
            ImageBytes = Convert.FromBase64String(imagePart.InlineData.Data),
            RequestId = data.ResponseId
        };
    }
}
```

### Post-Processing: Resize to Preset Dimensions (ImageSharp)

Because Gemini returns fixed resolutions per aspect ratio/size combination (not arbitrary dimensions), we must resize or crop the output to match the exact preset dimensions.

```csharp
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

public class ImageProcessor : IImageProcessor
{
    /// <summary>
    /// Resize/crop image to exact preset dimensions.
    /// Strategy: scale to cover target, then center-crop.
    /// </summary>
    public byte[] ResizeToPreset(byte[] imageBytes, int targetWidth, int targetHeight)
    {
        using var image = Image.Load(imageBytes);
        var imgWidth = image.Width;
        var imgHeight = image.Height;

        // Scale to cover target dimensions
        var scale = Math.Max(
            (double)targetWidth / imgWidth,
            (double)targetHeight / imgHeight);

        var newWidth = (int)(imgWidth * scale);
        var newHeight = (int)(imgHeight * scale);

        image.Mutate(x => x.Resize(newWidth, newHeight));

        // Center crop to exact target
        var left = (newWidth - targetWidth) / 2;
        var top = (newHeight - targetHeight) / 2;
        image.Mutate(x => x.Crop(new Rectangle(left, top, targetWidth, targetHeight)));

        using var output = new MemoryStream();
        image.SaveAsPng(output);
        return output.ToArray();
    }
}
```

### Watermark Application (ImageSharp)

```csharp
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

public partial class ImageProcessor
{
    /// <summary>
    /// Apply logo watermark to generated image (bottom-right).
    /// </summary>
    public byte[] ApplyWatermark(
        byte[] imageBytes,
        byte[] logoBytes,
        float opacity = 0.7f,
        float scale = 0.15f,
        int margin = 20)
    {
        using var image = Image.Load(imageBytes);
        using var logo = Image.Load(logoBytes);

        // Scale logo relative to image width
        var logoWidth = (int)(image.Width * scale);
        var logoHeight = (int)(logo.Height * ((double)logoWidth / logo.Width));
        logo.Mutate(x => x.Resize(logoWidth, logoHeight));

        // Apply opacity
        logo.Mutate(x => x.Opacity(opacity));

        // Position bottom-right
        var point = new Point(
            image.Width - logoWidth - margin,
            image.Height - logoHeight - margin);

        image.Mutate(x => x.DrawImage(logo, point, 1f));

        using var output = new MemoryStream();
        image.SaveAsPng(output);
        return output.ToArray();
    }
}
```

---

## Hard Delete Implementation

### Requirement

> **Hard Delete**: When a user deletes a brand or generation, the system MUST remove both database rows AND stored assets; soft delete is forbidden.

### Delete Generation

```csharp
public async Task DeleteGenerationAsync(
    Guid brandId, Guid generationId,
    ClaimsPrincipal user, CancellationToken ct)
{
    var userId = user.GetUserId();

    // Verify ownership
    var generation = await _generationRepository.GetWithOwnershipCheckAsync(
        brandId, generationId, userId, ct);
    if (generation is null)
        throw new NotFoundException("Generation not found");

    // 1. Delete from storage if this generation produced an image
    if (generation.ImagePath is not null)
        await _storageService.DeleteAsync(generation.ImagePath, ct);

    // 2. Delete DB row
    await _generationRepository.DeleteAsync(generationId, ct);
}
```

### Delete Brand (Cascade)

```csharp
public async Task DeleteBrandAsync(
    Guid brandId, ClaimsPrincipal user, CancellationToken ct)
{
    var userId = user.GetUserId();
    var brand = await _brandRepository.GetByIdAsync(brandId, ct);
    if (brand is null || brand.OwnerUserId != userId)
        throw new NotFoundException("Brand not found");

    // 1. Get all generation paths (succeeded rows only)
    var imagePaths = await _generationRepository
        .GetImagePathsByBrandIdAsync(brandId, ct);

    // 2. Delete all generation images from storage
    foreach (var path in imagePaths)
    {
        try { await _storageService.DeleteAsync(path, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete {Path}", path); }
    }

    // 3. Delete brand logo if exists
    if (brand.LogoPath is not null)
    {
        try { await _storageService.DeleteAsync(brand.LogoPath, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete logo"); }
    }

    // 4. Get all provider keys and delete Vault secrets
    var keys = await _keyRepository.GetAllByBrandIdAsync(brandId, ct);
    foreach (var key in keys)
    {
        try { await _vaultService.DeleteSecretAsync(key.VaultSecretId, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete vault secret"); }
    }

    // 5. Delete brand row (cascades brand_kits, provider_keys, generations)
    await _brandRepository.DeleteAsync(brandId, ct);
}
```

---

## Frontend Structure

```
apps/web/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page (redirect to login or dashboard)
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout (no nav)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout (nav, brand selector)
│   │   ├── account/
│   │   │   └── page.tsx            # Account settings (profile)
│   │   ├── brands/
│   │   │   ├── page.tsx            # Brand list
│   │   │   └── new/
│   │   │       └── page.tsx        # Create brand form
│   │   └── [brandId]/
│   │       ├── layout.tsx          # Brand-specific layout
│   │       ├── page.tsx            # Generator (main view)
│   │       ├── kit/
│   │       │   └── page.tsx        # Brand kit interview wizard
│   │       ├── keys/
│   │       │   └── page.tsx        # Provider keys management
│   │       ├── history/
│   │       │   └── page.tsx        # Generation history
│   │       └── settings/
│   │           └── page.tsx        # Brand settings, delete
│   └── admin/
│       ├── layout.tsx              # Admin layout (gated)
│       └── page.tsx                # Admin dashboard
├── components/
│   ├── ui/                         # Design system primitives (dark AI theme)
│   ├── brand-selector.tsx
│   ├── generator/
│   │   ├── generator-form.tsx
│   │   ├── preset-selector.tsx
│   │   ├── provider-selector.tsx
│   │   ├── logo-mode-selector.tsx
│   │   └── result-preview.tsx
│   ├── kit-wizard/
│   │   ├── wizard-container.tsx
│   │   ├── step-name.tsx
│   │   ├── step-tagline.tsx
│   │   ├── step-tone.tsx
│   │   ├── step-audience.tsx
│   │   ├── step-colors.tsx
│   │   └── step-avoid.tsx
│   ├── history/
│   │   ├── history-list.tsx
│   │   ├── history-card.tsx
│   │   └── image-modal.tsx
│   ├── keys/
│   │   ├── keys-tabs.tsx
│   │   ├── key-card.tsx
│   │   └── add-key-modal.tsx
│   ├── account/
│   │   └── profile-form.tsx
│   └── brand/
│       ├── brand-card.tsx
│       ├── create-brand-modal.tsx
│       └── delete-brand-dialog.tsx
├── lib/
│   ├── api.ts                      # API client (fetch wrapper)
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client
│   ├── presets.ts                   # Platform presets
│   └── utils.ts                    # Utility functions
├── hooks/
│   ├── use-profile.ts
│   ├── use-brand.ts
│   ├── use-brands.ts
│   ├── use-generations.ts
│   └── use-kit.ts
├── types/
│   └── index.ts                    # TypeScript types
├── styles/
│   └── globals.css                 # Dark AI design tokens
└── middleware.ts                    # Auth middleware
```

### Key UI Components

#### Generator Form

- Provider selector (OpenAI / Gemini)
- Model selector (based on provider)
- Platform preset selector (grouped by platform)
- Prompt textarea
- Logo mode selector (none / prompt / watermark / both)
- Generate button (shows loading spinner during synchronous call)
- Result preview with download

#### Brand Kit Wizard

- Step indicator (1-6)
- Form for current step
- Previous / Next / Skip buttons
- Auto-save on step completion
- Completion summary

#### History List

- Card grid with thumbnails
- Provider and platform badges
- Date display
- Click to view full image
- Delete button with confirmation

---

## Build Order

### Phase 1: Foundation

| Task | Description |
|------|-------------|
| 1.1 | Create repo structure (`apps/web/`, `apps/api/`, `supabase/`) |
| 1.2 | Initialize Supabase project |
| 1.3 | Create DB extensions, enum types, helper functions |
| 1.4 | Create database schema (all 5 tables, including `profiles`) |
| 1.5 | Add constraints and indexes (including partial unique for active keys) |
| 1.6 | Add `updated_at` triggers |
| 1.7 | Add RLS policies (`ENABLE` + `FORCE`) |
| 1.8 | Create storage bucket `brand-assets` (public) |
| 1.9 | Initialize ASP.NET Core .NET 10 project with solution structure |
| 1.10 | Add Supabase JWT validation middleware |
| 1.11 | Add health endpoint |
| 1.12 | Add OpenAPI generation |
| 1.13 | Initialize Next.js 14 project |
| 1.14 | Configure Supabase auth (email/password, no email confirmation) |
| 1.15 | Add auth pages + protected route middleware |
| 1.16 | Create design system tokens (dark AI theme) |
| 1.17 | API: Add `GET /me` endpoint |
| 1.18 | API: Add `PATCH /me` endpoint |
| 1.19 | UI: Add account settings page (profile edit) |

**Checkpoint**: Both services run locally, auth works end-to-end, and user can edit profile info.

### Phase 2: Dockerization

| Task | Description |
|------|-------------|
| 2.1 | Create `docker-compose.yml` for local development (ASP.NET + Next.js) |
| 2.2 | Add `.dockerignore` |
| 2.3 | Create `Dockerfile.api` for ASP.NET Core |
| 2.4 | Create `Dockerfile.web` for Next.js |
| 2.5 | Wire internal networking (Next.js → ASP.NET via compose service name) |
| 2.6 | Add healthcheck strategy for both services |
| 2.7 | Validate compose stack runs locally with auth + API health |
| 2.8 | Document local setup in `docs/docker.md` |

**Checkpoint**: Docker compose runs the full app locally and reproducibly.

### Phase 3: Brand CRUD

| Task | Description |
|------|-------------|
| 3.1 | API: List brands endpoint |
| 3.2 | API: Create brand endpoint |
| 3.3 | API: Get brand endpoint |
| 3.4 | API: Delete brand endpoint (with hard delete) |
| 3.5 | API: Logo upload endpoint |
| 3.6 | API: Logo delete endpoint |
| 3.7 | UI: Brand list page |
| 3.8 | UI: Create brand modal |
| 3.9 | UI: Brand selector in nav |
| 3.10 | UI: Brand settings page |
| 3.11 | UI: Delete brand confirmation (type name) |

**Checkpoint**: User can create, view, and delete brands. Hard delete verified.

### Phase 4: Provider Keys

| Task | Description |
|------|-------------|
| 4.1 | API: List keys endpoint |
| 4.2 | API: Add key endpoint (Vault integration) |
| 4.3 | API: Activate key endpoint (deactivate old active key atomically) |
| 4.4 | API: Validate key endpoint (OpenAI) |
| 4.5 | API: Validate key endpoint (Gemini) |
| 4.6 | API: Delete key endpoint (Vault + DB) |
| 4.7 | UI: Keys page with tabs |
| 4.8 | UI: Add key modal |
| 4.9 | UI: Key card with validate button + activate action |
| 4.10 | UI: Validation + active status display |

**Checkpoint**: User can add, validate, and delete API keys. Keys never exposed to client.

### Phase 5: Brand Kit

| Task | Description |
|------|-------------|
| 5.1 | API: Get kit endpoint |
| 5.2 | API: Upsert kit endpoint |
| 5.3 | API: Summary derivation logic |
| 5.4 | UI: Wizard container |
| 5.5 | UI: Step 1 - Name |
| 5.6 | UI: Step 2 - Tagline |
| 5.7 | UI: Step 3 - Tone |
| 5.8 | UI: Step 4 - Audience |
| 5.9 | UI: Step 5 - Colors |
| 5.10 | UI: Step 6 - Avoid words |
| 5.11 | UI: Completion summary |
| 5.12 | UI: Status badge in nav |

**Checkpoint**: User can complete brand kit interview. Works with 0 answers and complete kit.

### Phase 6: Generation

| Task | Description |
|------|-------------|
| 6.1 | API: Generation pipeline (synchronous, inline HTTP) |
| 6.2 | API: Insert `pending` generation rows and transition status lifecycle |
| 6.3 | API: OpenAI provider adapter |
| 6.4 | API: Gemini provider adapter (with aspect_ratio mapping) |
| 6.5 | API: ImageSharp post-processing resize/crop logic |
| 6.6 | API: ImageSharp logo watermark logic |
| 6.7 | API: Generate endpoint |
| 6.8 | API: Provider failure capture (`error_code`, `error_message`) |
| 6.9 | UI: Generator form |
| 6.10 | UI: Preset selector (grouped by platform) |
| 6.11 | UI: Provider/model selector |
| 6.12 | UI: Logo mode selector |
| 6.13 | UI: Result preview |
| 6.14 | UI: Download button |

**Checkpoint**: User can generate images with both providers, all presets, all logo modes.

### Phase 7: History

| Task | Description |
|------|-------------|
| 7.1 | API: List generations endpoint (page-based pagination, provider/status filters) |
| 7.2 | API: Get generation endpoint |
| 7.3 | API: Delete generation endpoint (hard delete) |
| 7.4 | UI: History list page |
| 7.5 | UI: History card component |
| 7.6 | UI: Full image modal |
| 7.7 | UI: Delete confirmation |
| 7.8 | UI: Provider filter |

**Checkpoint**: User can view and delete history. Hard delete verified.

### Phase 8: Admin

| Task | Description |
|------|-------------|
| 8.1 | API: Admin brands endpoint (`GET /admin/brands` — all brands + per-brand counts) |
| 8.2 | API: Admin stats endpoint (`GET /admin/stats` — aggregate usage counts) |
| 8.3 | API: Admin gate (email allowlist) |
| 8.4 | UI: Admin page (gated, read-only dashboard: stats + all-brands list) |
| 8.5 | Error handling polish |
| 8.6 | Loading states |
| 8.7 | Empty states |
| 8.8 | Definition of Done verification |

**Checkpoint**: Operator admin monitoring complete and verified.

---

## Dockerization

### Deliverables

- `docker/Dockerfile.api` (ASP.NET Core)
- `docker/Dockerfile.web` (Next.js)
- `docker-compose.yml`
- `docker/.dockerignore`
- `docs/docker.md`

### Container Requirements

- Use pinned base image tags and multi-stage builds.
- Run as non-root user in runtime stage.
- Docker compose for local development with both services.
- Next.js is the public-facing port; ASP.NET listens internally.
- Include healthchecks that verify both frontend and backend.
- Keep secrets in env files or host environment; do not bake secrets into images.
- To be migrated to a production host later.

---

## Environment Variables

### Frontend (`apps/web/.env.local`)

```bash
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Browser -> Next.js (same-origin API route/rewrite)
NEXT_PUBLIC_API_URL=/api

# Next.js server -> internal ASP.NET
NEXT_SERVER_API_URL=http://127.0.0.1:5000
```

### Backend (`apps/api/appsettings.json` + env overrides)

```bash
# Supabase
Supabase__Url=https://xxx.supabase.co
Supabase__SecretKey=sb_secret_...

# Storage
Storage__Bucket=brand-assets

# Admin
Admin__Emails=admin@example.com,admin2@example.com

# Server
Server__Host=127.0.0.1
Server__Port=5000
```

### Production Notes

- `Supabase__SecretKey` must only be used server-side
- Never expose the secret key to frontend
- `Admin__Emails` controls operator access

---

## Verification Checklist

### Definition of Done (per feature)

- [ ] Works for brand with 0 brand kit answers
- [ ] Works for brand with complete brand kit
- [ ] Works with OpenAI provider
- [ ] Works with Gemini provider
- [ ] User can fetch and update own profile (`GET /me`, `PATCH /me`)
- [ ] RLS policies tested (query as different user fails)
- [ ] Generation lifecycle tested (`pending` → `processing` → `succeeded|failed`)
- [ ] Hard delete verified (DB rows AND storage assets removed)

### Data Integrity Verification

- [ ] `provider_keys`: max one active key per `(brand_id, provider)`
- [ ] `profiles`: one row per `user_id`; `full_name` length validation enforced
- [ ] `brand_kits`: `complete` status cannot be saved without required fields
- [ ] `generations`: `succeeded` rows require `image_path`, failed rows require `error_code`
- [ ] `updated_at` trigger updates timestamps on every row update
- [ ] Indexes support hottest queries:
  - [ ] Brands by owner
  - [ ] Active provider key lookup by brand/provider
  - [ ] Generation history by brand and created date
  - [ ] Generation filters by provider/status

### Security Verification

- [ ] Provider keys never appear in:
  - [ ] API responses
  - [ ] Frontend state
  - [ ] Browser network tab
  - [ ] Server logs
- [ ] Brand isolation:
  - [ ] User A cannot access User B's profile
  - [ ] User A cannot access User B's brands
  - [ ] User A cannot access User B's generations
  - [ ] User A cannot access User B's keys
- [ ] Server-side validation:
  - [ ] Brand ID verified for all operations
  - [ ] User cannot forge brand ownership
- [ ] Public URLs are shareable. Brand isolation is enforced at DB and API layers. Storage privacy is deferred.

### RLS Test Cases

```sql
-- Test as User A (should see their own profile only)
SET request.jwt.claims = '{"sub": "user-a-id"}';
SELECT * FROM profiles; -- Should return only User A profile row

-- Test as User A (should see their brands)
SET request.jwt.claims = '{"sub": "user-a-id"}';
SELECT * FROM brands; -- Should return User A's brands

-- Test as User B (should NOT see User A's profile or brands)
SET request.jwt.claims = '{"sub": "user-b-id"}';
SELECT * FROM profiles WHERE user_id = 'user-a-id'; -- Should return 0 rows
SELECT * FROM brands WHERE id = 'user-a-brand-id'; -- Should return 0 rows
```

---

## Files to Create

### Backend (`apps/api/`)

```
apps/api/
├── src/
│   ├── YaaImg.Api/
│   │   ├── Program.cs                     # Host builder, DI, middleware, CORS
│   │   ├── appsettings.json               # Configuration
│   │   ├── appsettings.Development.json    # Dev overrides
│   │   ├── Controllers/
│   │   │   ├── HealthController.cs
│   │   │   ├── MeController.cs
│   │   │   ├── BrandsController.cs
│   │   │   ├── BrandKitController.cs
│   │   │   ├── KeysController.cs
│   │   │   ├── GenerationsController.cs
│   │   │   └── AdminController.cs
│   │   └── Middleware/
│   │       ├── AuthMiddleware.cs           # JWT validation
│   │       └── ErrorHandlingMiddleware.cs  # Problem Details
│   ├── YaaImg.Application/
│   │   ├── Services/
│   │   │   ├── ProfileService.cs
│   │   │   ├── BrandService.cs
│   │   │   ├── BrandKitService.cs
│   │   │   ├── KeyService.cs
│   │   │   ├── GenerationService.cs        # Synchronous pipeline
│   │   │   ├── PromptBuilder.cs
│   │   │   ├── BrandSummaryBuilder.cs
│   │   │   └── AdminService.cs
│   │   └── Interfaces/
│   │       ├── IImageProvider.cs
│   │       ├── IImageProcessor.cs
│   │       ├── IVaultService.cs
│   │       └── IStorageService.cs
│   ├── YaaImg.Domain/
│   │   ├── Entities/
│   │   │   ├── Profile.cs
│   │   │   ├── Brand.cs
│   │   │   ├── BrandKit.cs
│   │   │   ├── ProviderKey.cs
│   │   │   └── Generation.cs
│   │   └── Enums/
│   │       ├── Provider.cs
│   │       ├── Tone.cs
│   │       ├── LogoMode.cs
│   │       ├── KitStatus.cs
│   │       ├── GenerationStatus.cs
│   │       └── PlatformPreset.cs
│   ├── YaaImg.Infrastructure/
│   │   ├── Persistence/
│   │   │   └── SupabaseDbContext.cs
│   │   ├── Providers/
│   │   │   ├── OpenAiImageProvider.cs
│   │   │   └── GeminiImageProvider.cs
│   │   ├── ImageProcessing/
│   │   │   └── ImageSharpProcessor.cs      # Resize + watermark
│   │   ├── Storage/
│   │   │   └── SupabaseStorageService.cs
│   │   └── Vault/
│   │       └── SupabaseVaultService.cs
│   └── YaaImg.Contracts/
│       ├── Requests/
│       │   ├── GenerateRequest.cs
│       │   ├── UpdateProfileRequest.cs
│       │   ├── UpsertKitRequest.cs
│       │   └── AddKeyRequest.cs
│       └── Responses/
│           ├── GenerationResponse.cs
│           ├── BrandResponse.cs
│           ├── KeyResponse.cs
│           ├── KitResponse.cs
│           └── ProfileResponse.cs
└── tests/
    ├── YaaImg.UnitTests/
    │   ├── PromptBuilderTests.cs
    │   ├── BrandSummaryBuilderTests.cs
    │   └── ImageProcessorTests.cs
    └── YaaImg.IntegrationTests/
        ├── AuthTests.cs
        ├── BrandCrudTests.cs
        ├── KeyTests.cs
        ├── GenerationPipelineTests.cs
        └── RlsIsolationTests.cs
```

### Frontend (`apps/web/`)

```
apps/web/
├── app/                            # (structure shown above)
├── components/                     # (structure shown above)
├── lib/                            # (structure shown above)
├── hooks/                          # (structure shown above)
├── types/
│   └── index.ts
├── styles/
│   └── globals.css                 # Dark AI design tokens
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
├── middleware.ts
└── .env.local.example
```

### Supabase (`supabase/`)

```
supabase/
├── migrations/
│   ├── 00001_extensions_types_helpers.sql
│   ├── 00002_create_profiles.sql
│   ├── 00003_create_brands.sql
│   ├── 00004_create_brand_kits.sql
│   ├── 00005_create_provider_keys.sql
│   ├── 00006_create_generations.sql
│   ├── 00007_add_indexes.sql
│   ├── 00008_add_updated_at_triggers.sql
│   └── 00009_add_rls_policies.sql
├── seed.sql                        # (optional test data)
└── config.toml
```

### Root (`/`)

```
/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── .dockerignore
├── docker-compose.yml
├── docs/
│   ├── implamintion-plan.md
│   └── docker.md
├── scripts/
├── .gitignore
└── README.md
```

---

## Appendix: Model Reference

### OpenAI Image Models

| Model | Description |
|-------|-------------|
| `gpt-image-2` | Latest image generation model (default) |
| `gpt-image-1` | Previous generation (fallback) |

### Gemini Image Models

| Model | Description |
|-------|-------------|
| `gemini-3-pro-image-preview` | Nano Banana Pro — highest quality (default) |

### Gemini Aspect Ratios and Sizes

Gemini image generation uses `aspect_ratio` and `image_size` instead of explicit dimensions:

| Aspect Ratio | Supported |
|--------------|-----------|
| `1:1` | Square |
| `16:9` | Landscape |
| `9:16` | Portrait |
| `4:3` | Standard landscape |
| `3:4` | Standard portrait |

| Image Size | Resolution Range |
|------------|------------------|
| `1K` | ~1024px on longest edge (default for MVP) |
| `2K` | ~2048px on longest edge |
| `4K` | ~4096px on longest edge |

Post-processing (resize/crop via ImageSharp) is required to achieve exact preset dimensions.

---

*End of Implementation Plan*