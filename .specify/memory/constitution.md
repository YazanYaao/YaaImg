# YaaImg Constitution

**Version:** 2.0.0  
**Ratified:** 2026-07-09  
**Status:** Active

## I. Product Scope

YaaImg is a multi-brand SaaS for generating social images with the following foundational rules:

- Tenancy MUST be based on Brand; every resource belongs to exactly one brand
- One user owns brands; sharing is not supported; only owner role exists
- No billing in MVP; users MUST provide their own API keys (BYOK model)
- Image generation is the sole product capability

## II. Non-Negotiables

These constraints MUST NOT be violated under any circumstances:

- **Brand Isolation**: Every resource (generations, brand kits, keys) MUST belong to exactly one brand
- **Hard Delete**: When a user deletes a brand or generation, the system MUST remove both database rows AND stored assets; soft delete is forbidden
- **Key Secrecy**: Provider keys MUST NEVER appear in logs; keys MUST NEVER be sent to the client
- **Official Endpoints Only**: The system MUST use only official API endpoints for OpenAI and Gemini; no proxies or unofficial APIs
- **PNG Output Only**: All generated images MUST be output as PNG format

## III. Tech Constraints

The technology stack is fixed for MVP:

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Backend | ASP.NET Core .NET 10, C# |
| Image Processing | SixLabors.ImageSharp |
| Auth, DB, Vault, Storage | Supabase |
| Deployment | Local development (Docker compose or native); production host TBD |
| Providers | OpenAI, Gemini |
| Capability | Image generation only |

Deviations from this stack require explicit constitutional amendment.

## IV. Architectural Constraints

These architectural decisions are fixed for MVP:

- **Processing**: Synchronous generation (inline HTTP); no background worker, no SignalR, no WebSockets
- **Storage**: Public bucket with unguessable UUID paths; no signed URLs, no expiration
- **Tenancy**: Brand-based (`brand_id` owns keys, data, and assets)
- **API Routing**: No versioning prefix; brand-scoped paths (`/brands/{id}/...`)
- **Pagination**: Page-based (offset/limit)
- **Generation States**: 4 simple states only: `pending`, `processing`, `succeeded`, `failed`
- **Retry**: None; no `retry_of_generation_id` or background retries
- **Error Format**: Problem Details (RFC 9457)
- **Accounts**: No account deletion cascade, no daily limits, no cost tracking

## V. Data Rules

All data persistence MUST follow these rules:

- **Generation Records**: MUST store prompt, provider, model, dimensions preset, and image storage path
- **Brand Kit**: MUST store brand kit answers and derived brand summary
- **Provider Keys**: MUST be stored in Supabase Vault; database MUST reference keys by opaque IDs only, never storing raw key values

## VI. UX Rules

User experience MUST adhere to these patterns:

- Free-form prompt is the primary input mechanism for image generation
- Brand kit MUST be created via an interview flow; direct editing is secondary
- Platform preset (dimensions) MUST be selected for each generation; no default fallback
- History MUST be first-class; MUST be filterable by brand and provider
- UI MUST be dark mode only, desktop-first, usable on mobile
- Visual direction is "Dark AI" with restrained neon blue or purple accents
- Typography uses Inter from Google Fonts

## VII. Security Rules

Security implementation MUST follow these requirements:

- Supabase Row Level Security (RLS) MUST be enabled on all tables
- Brand ID MUST be verified server-side for all read and write operations; client assertions are insufficient
- Provider API calls MUST originate from server only; client MUST NEVER call providers directly
- Logs MUST contain only request IDs and safe metadata; no keys, tokens, or PII in logs

## VIII. Definition of Done

A feature is complete only when ALL of the following are verified:

- [ ] Works correctly for a brand with no brand kit (0 answers)
- [ ] Works correctly for a brand with a completed brand kit
- [ ] Works with OpenAI provider
- [ ] Works with Gemini provider
- [ ] RLS policies tested OR explicit integration checks documented
- [ ] Hard delete verified: database rows removed AND storage assets removed

## Governance

### Amendment Process

- Amendments MUST be documented in this file with version increment
- Changes to Non-Negotiables (Principle II) require explicit justification
- All dependent templates MUST be reviewed after amendments

### Versioning Policy

- **MAJOR**: Backward-incompatible changes to principles or removal of constraints
- **MINOR**: New principles added or existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, non-semantic changes

### Compliance

- All pull requests MUST verify compliance with this constitution
- Plan documents MUST include a Constitution Check section
- Definition of Done checklist MUST be completed before feature merge
