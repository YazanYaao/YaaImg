# Tasks: Foundation

**Input**: Design documents from `specs/001-foundation/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not explicitly requested in spec. Test tasks are omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `apps/api/src/YaaImg.*/`
- **Frontend**: `apps/web/`
- **Migrations**: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the monorepo directory structure, initialize both application projects, and configure tooling.

- [x] T001 Create monorepo directory structure: `apps/api/`, `apps/web/`, `supabase/migrations/`, `docs/`, `scripts/`
- [x] T002 Create ASP.NET solution and 5 class library projects: `apps/api/src/YaaImg.sln` with `YaaImg.Api`, `YaaImg.Application`, `YaaImg.Domain`, `YaaImg.Infrastructure`, `YaaImg.Contracts`
- [x] T003 [P] Initialize Next.js 14 (App Router) project with TypeScript in `apps/web/`
- [x] T004 [P] Add NuGet dependencies to `YaaImg.Api`: `Microsoft.AspNetCore.Authentication.JwtBearer`, `Swashbuckle.AspNetCore`, `Npgsql`
- [x] T005 [P] Add npm dependencies to `apps/web/`: `@supabase/supabase-js`, `@supabase/ssr`
- [x] T006 [P] Create environment config files: `apps/api/src/YaaImg.Api/appsettings.json`, `apps/api/src/YaaImg.Api/appsettings.Development.json`, `apps/web/.env.local.example`
- [x] T007 [P] Create `supabase/config.toml` with project configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth middleware, error handling, and design system — MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database Schema & Migrations

- [ ] T008 Create migration `supabase/migrations/00001_extensions_types_helpers.sql`: pgcrypto extension, all 6 enum types (`provider_t`, `tone_t`, `logo_mode_t`, `kit_status_t`, `generation_status_t`, `platform_preset_t`), `set_updated_at()` trigger function, `all_hex_colors()` helper function
- [ ] T009 Create migration `supabase/migrations/00002_create_profiles.sql`: `profiles` table with user_id PK, full_name CHECK, avatar_url CHECK
- [ ] T010 Create migration `supabase/migrations/00003_create_brands.sql`: `brands` table with owner_user_id FK, name CHECK, logo_path CHECK, unique index on (owner_user_id, lower(name)), created_at DESC index
- [ ] T011 [P] Create migration `supabase/migrations/00004_create_brand_kits.sql`: `brand_kits` table with all CHECK constraints (cardinality, hex colors, complete status requires tone+audience+colors, completed_at consistency)
- [ ] T012 [P] Create migration `supabase/migrations/00005_create_provider_keys.sql`: `provider_keys` table with partial unique index (one active per brand/provider), lookup index
- [ ] T013 [P] Create migration `supabase/migrations/00006_create_generations.sql`: `generations` table with status-dependent CHECK constraint, 3 composite indexes
- [ ] T014 Create migration `supabase/migrations/00007_add_updated_at_triggers.sql`: BEFORE UPDATE triggers on all 5 tables executing `set_updated_at()`
- [ ] T015 Create migration `supabase/migrations/00008_add_rls_policies.sql`: `is_brand_owner()` SECURITY DEFINER function, ENABLE + FORCE RLS on all 5 tables, per-operation policies for brands, owner_all policies for profiles/brand_kits/provider_keys/generations
- [ ] T016 Create migration `supabase/migrations/00009_add_profile_trigger.sql`: `handle_new_user()` function + `on_auth_user_created` trigger on `auth.users` to auto-insert profiles row
- [ ] T017 Create public storage bucket `brand-assets` in Supabase dashboard (manual step; document in `docs/supabase-setup.md`)

### Backend Foundation

- [ ] T018 Configure `Program.cs` in `apps/api/src/YaaImg.Api/`: host builder, Kestrel on port 5000, CORS policy (allow `http://localhost:3000`), service registration, middleware pipeline
- [ ] T019 Implement JWT authentication middleware in `apps/api/src/YaaImg.Api/Middleware/JwtAuthMiddleware.cs`: validate Supabase JWT using HS256 + project secret, extract `sub` claim as user ID, validate `iss` and `aud`
- [ ] T020 [P] Implement global error handling middleware in `apps/api/src/YaaImg.Api/Middleware/ProblemDetailsMiddleware.cs`: catch exceptions, map to RFC 9457 Problem Details responses with `type`, `title`, `status`, `detail`, `traceId`, `errorCode`
- [ ] T021 [P] Configure OpenAPI/Swagger generation with `Swashbuckle.AspNetCore` in `Program.cs`: enable Swagger UI at `/swagger` in development, add JWT security scheme definition
- [ ] T022 [P] Create domain exception classes in `apps/api/src/YaaImg.Domain/`: `NotFoundException`, `ValidationException`, `ForbiddenException`

### Frontend Foundation

- [ ] T023 Create Dark AI design tokens in `apps/web/styles/globals.css`: CSS custom properties for colors (deep navy/charcoal backgrounds, neon blue/purple accents), typography (Inter font from Google Fonts), spacing scale, border-radius, shadows, transitions
- [ ] T024 [P] Create root layout in `apps/web/app/layout.tsx`: import Inter font, apply design tokens, HTML lang/meta tags
- [ ] T025 [P] Create Supabase browser client in `apps/web/lib/supabase/client.ts`: `createBrowserClient()` with public URL and anon key
- [ ] T026 [P] Create Supabase server client in `apps/web/lib/supabase/server.ts`: `createServerClient()` with cookie handling for App Router
- [ ] T027 [P] Create backend API client in `apps/web/lib/api.ts`: fetch wrapper that forwards Supabase access token as `Authorization: Bearer` header, base URL from environment
- [ ] T028 Create auth middleware in `apps/web/middleware.ts`: check Supabase session on every request, redirect unauthenticated users to `/login` for protected routes, redirect authenticated users away from `/login` and `/signup`

**Checkpoint**: Foundation ready — both services start locally, DB schema applied, auth middleware configured, design system in place. User story implementation can now begin.

---

## Phase 3: User Story 1 & 4 — Sign Up, Log In & Data Isolation (Priority: P1) 🎯 MVP

**Goal**: Users can register with email/password, verify via email, log in, log out, and access a protected dashboard. All user data is isolated via RLS.

**Independent Test**: Visit the app → sign up → verify email → log in → see dashboard → log out → confirm redirect to login. Create two users and verify cross-user data access returns zero results.

### Implementation for User Story 1 & 4

- [ ] T029 [US1] Create auth layout in `apps/web/app/(auth)/layout.tsx`: centered card layout, dark AI styling, no nav bar
- [ ] T030 [P] [US1] Create sign-up page in `apps/web/app/(auth)/signup/page.tsx`: email + password form, call `supabase.auth.signUp()`, show success message "Check your email to verify", link to login page, handle duplicate email error
- [ ] T031 [P] [US1] Create login page in `apps/web/app/(auth)/login/page.tsx`: email + password form, call `supabase.auth.signInWithPassword()`, redirect to dashboard on success, show error on invalid credentials, link to sign-up page
- [ ] T032 [US1] Create dashboard layout in `apps/web/app/(dashboard)/layout.tsx`: shell with navigation placeholder, logout button calling `supabase.auth.signOut()` then redirect to `/login`
- [ ] T033 [US1] Create dashboard landing page in `apps/web/app/(dashboard)/page.tsx`: placeholder welcome screen (redirect target after login)
- [ ] T034 [US1] Create landing page in `apps/web/app/page.tsx`: redirect to `/login` if unauthenticated or `/dashboard` if authenticated
- [ ] T035 [US1] Configure Supabase Auth settings: enable email provider, enable email confirmation, set redirect URLs (manual step; document in `docs/supabase-setup.md`)

**Checkpoint**: User Story 1 & 4 are functional — sign-up with email verification, login, logout, protected routes, and RLS isolation all verified.

---

## Phase 4: User Story 2 — View and Edit Profile (Priority: P2)

**Goal**: Authenticated users can view and update their profile (full name, avatar URL) via the account settings page, backed by the `GET /me` and `PATCH /me` API endpoints.

**Independent Test**: Log in → navigate to account settings → update full name → save → refresh → name persists. Try invalid name (1 char) → validation error shown.

### Implementation for User Story 2

- [ ] T036 [P] [US2] Create `Profile` entity in `apps/api/src/YaaImg.Domain/Entities/Profile.cs`: `UserId`, `FullName`, `AvatarUrl`, `CreatedAt`, `UpdatedAt`
- [ ] T037 [P] [US2] Create `ProfileResponse` DTO in `apps/api/src/YaaImg.Contracts/Responses/ProfileResponse.cs`: `UserId`, `Email`, `FullName`, `AvatarUrl`, `CreatedAt`, `UpdatedAt`
- [ ] T038 [P] [US2] Create `UpdateProfileRequest` DTO in `apps/api/src/YaaImg.Contracts/Requests/UpdateProfileRequest.cs`: optional `FullName` (2–120 chars), optional `AvatarUrl` (http/https URL regex)
- [ ] T039 [P] [US2] Create `IProfileRepository` interface in `apps/api/src/YaaImg.Application/Interfaces/IProfileRepository.cs`: `GetByUserIdAsync()`, `UpdateAsync()`
- [ ] T040 [US2] Implement `ProfileRepository` in `apps/api/src/YaaImg.Infrastructure/Persistence/ProfileRepository.cs`: Npgsql queries against `profiles` table, join email from Supabase auth admin API or JWT claims
- [ ] T041 [US2] Implement `ProfileService` in `apps/api/src/YaaImg.Application/Services/ProfileService.cs`: `GetProfileAsync()` retrieves profile + email, `UpdateProfileAsync()` validates input and calls repository
- [ ] T042 [US2] Implement `MeController` in `apps/api/src/YaaImg.Api/Controllers/MeController.cs`: `GET /me` returns ProfileResponse, `PATCH /me` validates UpdateProfileRequest and returns updated ProfileResponse, both extract user ID from JWT claims
- [ ] T043 [US2] Register ProfileService and ProfileRepository in DI container in `apps/api/src/YaaImg.Api/Program.cs`
- [ ] T044 [P] [US2] Create account settings page in `apps/web/app/(dashboard)/account/page.tsx`: display email (read-only), editable full name input, editable avatar URL input, save button, loading state, validation error display
- [ ] T045 [US2] Create `useProfile` hook in `apps/web/hooks/use-profile.ts`: fetch `GET /me`, submit `PATCH /me`, handle loading/error states
- [ ] T046 [US2] Add account settings link to dashboard navigation in `apps/web/app/(dashboard)/layout.tsx`

**Checkpoint**: User Story 2 is functional — profile view and edit with validation, end-to-end from frontend through API to database.

---

## Phase 5: User Story 3 — System Health Verification (Priority: P3)

**Goal**: The backend exposes an unauthenticated `/health` endpoint for operators and monitoring.

**Independent Test**: Send `curl http://localhost:5000/health` → receive `200 OK` with `{"status": "healthy"}`.

### Implementation for User Story 3

- [ ] T047 [US3] Implement `HealthController` in `apps/api/src/YaaImg.Api/Controllers/HealthController.cs`: `GET /health` returns `{"status": "healthy", "timestamp": "..."}` with no auth requirement
- [ ] T048 [US3] Exclude `/health` from JWT auth middleware in `apps/api/src/YaaImg.Api/Middleware/JwtAuthMiddleware.cs`

**Checkpoint**: Health endpoint responds without authentication. All user stories are now functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation across all stories.

- [ ] T049 [P] Create `docs/supabase-setup.md` documenting manual Supabase configuration steps: project creation, auth settings, email confirmation, storage bucket, applying migrations
- [ ] T050 [P] Create `README.md` at project root: project overview, prerequisites (.NET 10, Node.js 20+, Supabase project), local setup instructions, running both services
- [ ] T051 [P] Add `apps/web/next.config.js` with API proxy rewrite rules: `/api/**` → `http://localhost:5000/**`
- [ ] T052 Review all controllers for consistent Problem Details error responses
- [ ] T053 Validate all 5 database tables accept valid data and reject invalid data per CHECK constraints
- [ ] T054 Run quickstart.md validation checklist end-to-end (all 10 scenarios)
- [ ] T055 Verify RLS isolation: create 2 users, confirm cross-user queries return 0 rows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1/US4 (Phase 3) should be completed first (auth is prerequisite for US2)
  - US2 (Phase 4) depends on Phase 3 (needs auth to test profile)
  - US3 (Phase 5) can run in parallel with Phase 3 or 4 (no auth needed)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 + US4 (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 (P2)**: Depends on US1 (needs working auth to test profile endpoints)
- **US3 (P3)**: Can start after Foundational — Independent of all other stories

### Within Each User Story

- Domain entities and DTOs before repositories
- Repositories before services
- Services before controllers
- Backend before frontend pages
- Core implementation before integration

### Parallel Opportunities

- T003, T004, T005, T006, T007 (Phase 1 setup) can all run in parallel
- T011, T012, T013 (brand_kits, provider_keys, generations migrations) can run in parallel
- T020, T021, T022 (error handling, OpenAPI, exceptions) can run in parallel
- T023, T024, T025, T026, T027 (frontend foundation) can run in parallel
- T030, T031 (signup + login pages) can run in parallel
- T036, T037, T038, T039 (US2 entities + DTOs) can run in parallel
- T049, T050, T051 (polish docs) can run in parallel
- US3 (Phase 5) can run in parallel with US1/US4 (Phase 3)

---

## Parallel Example: Phase 2 Foundation

```text
# Backend foundation — launch together:
Task T019: JWT auth middleware
Task T020: Problem Details middleware
Task T021: OpenAPI/Swagger config
Task T022: Domain exception classes

# Frontend foundation — launch together:
Task T023: Dark AI design tokens
Task T024: Root layout
Task T025: Supabase browser client
Task T026: Supabase server client
Task T027: API client
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 & 4 (Sign Up + Login + Data Isolation)
4. **STOP and VALIDATE**: Test auth flow independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1/US4 → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Profile) → Test independently → Deploy/Demo
4. Add US3 (Health) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 & 4 (Auth + Isolation)
   - Developer B: User Story 3 (Health — independent, no auth needed)
3. After US1 completes: Developer B picks up User Story 2 (Profile)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
