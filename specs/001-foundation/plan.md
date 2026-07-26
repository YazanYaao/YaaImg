# Implementation Plan: Foundation

**Branch**: `001-foundation` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-foundation/spec.md`

## Summary

Establish the YaaImg project foundation: monorepo structure, complete Supabase database schema (5 tables with enums, constraints, indexes, triggers, RLS), ASP.NET Core .NET 10 backend with JWT auth and profile endpoints, and Next.js 14 frontend with Supabase Auth integration, protected routes, and a Dark AI design system. This phase delivers the infrastructure for all subsequent features.

## Technical Context

**Language/Version**: C# / .NET 10, TypeScript / Node.js 20+

**Primary Dependencies**:
- Backend: ASP.NET Core .NET 10, Swashbuckle.AspNetCore, Npgsql, Microsoft.AspNetCore.Authentication.JwtBearer
- Frontend: Next.js 14 (App Router), @supabase/supabase-js, @supabase/ssr
- Database: Supabase PostgreSQL with pgcrypto extension

**Storage**: Supabase PostgreSQL (with RLS) + Supabase Storage (public bucket `brand-assets`)

**Testing**: xUnit (backend unit/integration), manual validation (see quickstart.md)

**Target Platform**: Local development (ASP.NET :5000, Next.js :3000); production host TBD

**Project Type**: Web application (monorepo: frontend + backend + database migrations)

**Performance Goals**: Health check < 2s, profile operations < 200ms, sign-up flow < 3 min

**Constraints**: Supabase Cloud dependency for auth/DB/storage; email verification required; dark mode only

**Scale/Scope**: Single-user MVP; 5 database tables; 3 API endpoints; 5 frontend pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | MVP scope is binding | ✅ PASS | Foundation phase creates schema and auth only — no speculative features |
| II | Modular monolith only | ✅ PASS | Single ASP.NET backend + Next.js frontend in monorepo. No microservices |
| III | ASP.NET owns business logic | ✅ PASS | Profile CRUD goes through ASP.NET. Browser only touches Supabase for auth sessions |
| IV | Account isolation is non-negotiable | ✅ PASS | RLS on all tables, JWT validation in backend, ownership checks in API |
| V | BYOK secrets never exposed | ✅ PASS | provider_keys schema stores vault_secret_id only. No key endpoints in this phase |
| VI | Generation is durable and observable | ⬜ N/A | Generation schema created but no generation logic in this phase |
| VII | Data lifecycle follows user intent | ⬜ N/A | Delete workflows come in later phases |
| VIII | Quality gates precede implementation | ✅ PASS | Spec, clarifications, research, data model, contracts, and quickstart all precede code |
| IX | UI consistency is constrained | ✅ PASS | Dark AI design tokens defined. Dark mode only. Inter font. Desktop-first |
| X | Runtime and dependency risk is explicit | ✅ PASS | .NET 10, Next.js 14.x pinned. Lockfiles required. No gratuitous packages |

### Post-Design Re-Check

All gates remain ✅ PASS or ⬜ N/A after Phase 1 design. No violations detected.

> **Note — Constitution vs. Implementation Plan divergence**: The constitution specifies `/api/v1` versioning, SignalR, BackgroundService worker, private storage with signed URLs, and user-based tenancy. The approved implementation plan (v1.5.0) specifies no versioning, no SignalR, synchronous processing, public storage, and brand-based tenancy. The implementation plan takes precedence per user-approved architectural specifications. A constitution amendment is recommended to align these.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   └── api.md           # Phase 1 API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/
├── api/
│   └── src/
│       ├── YaaImg.Api/                    # ASP.NET host (controllers, middleware, Program.cs)
│       │   ├── Controllers/
│       │   │   ├── HealthController.cs
│       │   │   └── MeController.cs
│       │   ├── Middleware/
│       │   │   ├── JwtAuthMiddleware.cs
│       │   │   └── ProblemDetailsMiddleware.cs
│       │   ├── Program.cs
│       │   ├── appsettings.json
│       │   └── appsettings.Development.json
│       ├── YaaImg.Application/            # Services and interfaces
│       │   ├── Services/
│       │   │   └── ProfileService.cs
│       │   └── Interfaces/
│       │       └── IProfileRepository.cs
│       ├── YaaImg.Domain/                 # Entities and enums
│       │   ├── Entities/
│       │   │   └── Profile.cs
│       │   └── Enums/
│       │       └── (empty for this phase — enums used in DB only)
│       ├── YaaImg.Infrastructure/         # Data access, external integrations
│       │   └── Persistence/
│       │       └── ProfileRepository.cs
│       ├── YaaImg.Contracts/              # Request/Response DTOs
│       │   ├── Requests/
│       │   │   └── UpdateProfileRequest.cs
│       │   └── Responses/
│       │       └── ProfileResponse.cs
│       └── YaaImg.sln
├── web/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout (Inter font, design tokens)
│   │   ├── page.tsx                       # Landing → redirect to login or dashboard
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx                 # Dashboard shell (nav placeholder)
│   │       └── account/page.tsx           # Profile settings
│   ├── components/
│   │   └── ui/                            # Design system primitives
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser Supabase client
│   │   │   └── server.ts                  # Server Supabase client
│   │   └── api.ts                         # Backend API client (fetch wrapper)
│   ├── styles/
│   │   └── globals.css                    # Dark AI design tokens
│   ├── middleware.ts                       # Auth check middleware
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
└── (empty — no test projects in this phase)

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
│   ├── 00009_add_rls_policies.sql
│   └── 00010_add_profile_trigger.sql
└── config.toml
```

**Structure Decision**: Web application structure with `apps/api/` (ASP.NET backend) and `apps/web/` (Next.js frontend) as separate application roots, plus `supabase/` for database migrations. This follows the modular monolith pattern defined in the constitution.

## Complexity Tracking

No constitution violations to justify. All design choices align with the approved implementation plan and constitution principles.
