# Research: Foundation

**Feature**: `001-foundation` | **Date**: 2026-07-09

## Research Tasks

### 1. Supabase Auth JWT Validation in ASP.NET Core

**Decision**: Validate Supabase-issued JWTs using ASP.NET Core's built-in `Microsoft.AspNetCore.Authentication.JwtBearer` middleware, configured with the Supabase project JWT secret.

**Rationale**: Supabase Auth issues standard JWTs signed with the project's JWT secret (HS256). ASP.NET Core has first-party JWT Bearer middleware that handles token parsing, signature verification, expiry checks, and claims extraction out of the box. No third-party library is needed.

**Alternatives considered**:
- *Custom middleware*: More control but duplicates well-tested framework logic. Rejected for unnecessary complexity.
- *Supabase .NET SDK*: No official ASP.NET auth integration exists. Using the raw JWT secret with standard middleware is simpler and more maintainable.

**Configuration**:
- Extract `sub` claim as the authenticated user ID
- Validate `iss` matches the Supabase project URL
- Validate `aud` = `authenticated`
- Reject expired tokens

---

### 2. Supabase Profile Auto-Creation on Sign-Up

**Decision**: Use a PostgreSQL trigger function on `auth.users` (via Supabase SQL editor) to automatically insert a `profiles` row when a new user registers.

**Rationale**: Supabase supports database triggers on `auth.users` insertions. This guarantees a profile row exists for every authenticated user without requiring application-level logic or webhook callbacks.

**Alternatives considered**:
- *Application-level "ensure profile exists" on first API call*: Adds latency and race-condition risk. Rejected.
- *Supabase Edge Function webhook*: Adds an external dependency and latency. Rejected for MVP simplicity.
- *Client-side POST after sign-up*: Unreliable if client crashes between sign-up and POST. Rejected.

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### 3. ASP.NET Core Project Structure for Modular Monolith

**Decision**: Use a multi-project solution structure with 5 class library projects under `apps/api/src/`: `YaaImg.Api` (host), `YaaImg.Application` (services), `YaaImg.Domain` (entities/enums), `YaaImg.Infrastructure` (providers/storage/vault), `YaaImg.Contracts` (DTOs).

**Rationale**: Clean Architecture boundaries enforce separation of concerns. The domain layer has no dependencies. The application layer depends only on domain. Infrastructure implements interfaces defined in the application layer. This follows the modular monolith principle from the constitution.

**Alternatives considered**:
- *Single project*: Simpler but blurs boundaries between domain, application, and infrastructure code. Rejected because the constitution mandates "clear application boundaries."
- *Feature-slice architecture*: Good for large teams but overkill for a single-developer MVP. Rejected.

---

### 4. Next.js 14 Auth Integration with Supabase

**Decision**: Use `@supabase/ssr` for server-side session management with Next.js 14 App Router. Middleware checks auth state on every request and redirects unauthenticated users.

**Rationale**: `@supabase/ssr` is the official Supabase library for server-side rendering frameworks. It handles cookie-based session storage, token refresh, and server/client context splitting. This aligns with Next.js 14 App Router patterns.

**Alternatives considered**:
- *`@supabase/auth-helpers-nextjs`*: Deprecated in favor of `@supabase/ssr`. Rejected.
- *Custom cookie management*: Duplicates tested logic. Rejected.

---

### 5. Problem Details (RFC 9457) Error Handling

**Decision**: Implement a global exception handler middleware in ASP.NET Core that catches domain exceptions and maps them to `ProblemDetails` responses. Use the built-in `app.UseExceptionHandler()` with custom mapping.

**Rationale**: ASP.NET Core has built-in `ProblemDetails` support via `Microsoft.AspNetCore.Http.Results.Problem()`. A global exception handler keeps controllers clean and ensures consistent error formatting.

**Alternatives considered**:
- *Per-controller try/catch*: Repetitive and error-prone. Rejected.
- *Hellang.Middleware.ProblemDetails*: Good third-party package but adds a dependency when the built-in support is sufficient. Rejected per constitution rule X (no packages solely for preference).

---

### 6. Dark AI Design System

**Decision**: Define CSS custom properties (design tokens) in `globals.css` for the "Dark AI" theme. Colors use deep navy/charcoal backgrounds with restrained neon blue/purple accents. Typography uses Inter from Google Fonts.

**Rationale**: The constitution mandates dark mode only, desktop-first, "Dark AI" visual direction. CSS custom properties provide a centralized token system without requiring a CSS framework dependency.

**Alternatives considered**:
- *Tailwind CSS*: Adds a build dependency and learning curve. Not requested by the user. Rejected.
- *CSS-in-JS (styled-components)*: Runtime overhead and doesn't align with Next.js 14 RSC patterns. Rejected.

---

### 7. OpenAPI Documentation Generation

**Decision**: Use `Swashbuckle.AspNetCore` to auto-generate OpenAPI 3.0 specs from controller attributes and XML comments. Serve the Swagger UI at `/swagger` in development only.

**Rationale**: Swashbuckle is the de facto standard for OpenAPI generation in ASP.NET Core. It reads route metadata, model schemas, and XML docs to produce accurate specs with zero manual authoring.

**Alternatives considered**:
- *NSwag*: Comparable quality but Swashbuckle has broader community adoption. Either is acceptable.
- *Manual OpenAPI YAML*: Error-prone and drifts from implementation. Rejected.

---

## Summary

All NEEDS CLARIFICATION items have been resolved. No blocking unknowns remain for Phase 1 design.

| Topic | Decision |
|-------|----------|
| JWT Auth | Standard ASP.NET JWT Bearer middleware with Supabase JWT secret |
| Profile auto-create | PostgreSQL trigger on `auth.users` insert |
| Project structure | 5-project Clean Architecture under `apps/api/src/` |
| Frontend auth | `@supabase/ssr` with Next.js middleware |
| Error handling | Global exception handler → RFC 9457 ProblemDetails |
| Design system | CSS custom properties, Inter font, Dark AI tokens |
| OpenAPI | Swashbuckle auto-generation |
