# Quickstart Validation Guide: Foundation

**Feature**: `001-foundation` | **Date**: 2026-07-09

This guide documents how to validate that the Foundation feature works end-to-end. It does not contain implementation code — see `tasks.md` and the source files for that.

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) installed
- [Node.js 20+](https://nodejs.org/) and npm installed
- A [Supabase](https://supabase.com/) project created (free tier is fine)
- Supabase project URL, anon/publishable key, and service role (secret) key available
- Supabase Auth email provider enabled (email confirmation ON)
- An email you can access for verification

---

## 1. Setup — Start Both Services

### Backend (ASP.NET Core)

```bash
cd apps/api/src/YaaImg.Api
dotnet run
```

Expected: Server starts on `http://localhost:5000`. Console shows `Now listening on: http://localhost:5000`.

### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Expected: Dev server starts on `http://localhost:3000`.

---

## 2. Validate Health Check (SC-004)

```bash
curl http://localhost:5000/health
```

**Expected response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-07-09T..."
}
```

**Pass criteria**: Response returns within 2 seconds with status `healthy`.

---

## 3. Validate Sign-Up Flow (SC-001, FR-001, FR-002)

1. Open `http://localhost:3000/signup` in a browser
2. Enter a valid email and password (6+ characters)
3. Click "Sign Up"

**Expected**:
- Success message: "Check your email to verify your account"
- A confirmation email arrives at the provided address
- Before clicking the link, navigating to `/dashboard` redirects to `/login`

4. Click the confirmation link in the email
5. Navigate to `http://localhost:3000/login`
6. Enter credentials and log in

**Expected**:
- Redirected to the dashboard shell at `/dashboard` or `/brands`
- No errors in console

**Pass criteria**: Full flow completes in under 3 minutes.

---

## 4. Validate Auth Redirect (SC-003, FR-004)

1. Open a new incognito/private browser window
2. Navigate directly to `http://localhost:3000/brands`

**Expected**: Redirected to `/login` page.

**Pass criteria**: 100% of unauthenticated requests to protected pages redirect.

---

## 5. Validate Profile Retrieval (SC-002, FR-007, FR-008)

After logging in:

```bash
# Replace <TOKEN> with the Supabase access_token from browser dev tools
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/me
```

**Expected response** (200 OK):
```json
{
  "user_id": "<your-user-id>",
  "email": "<your-email>",
  "full_name": null,
  "avatar_url": null,
  "created_at": "...",
  "updated_at": "..."
}
```

**Pass criteria**: Profile row exists (auto-created by trigger), `full_name` is null, response in under 200ms.

---

## 6. Validate Profile Update (SC-002, FR-009, FR-010)

### Happy path:

```bash
curl -X PATCH http://localhost:5000/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Jane Doe", "avatar_url": "https://example.com/avatar.png"}'
```

**Expected**: 200 OK with updated profile. `full_name` = "Jane Doe".

### Validation error — name too short:

```bash
curl -X PATCH http://localhost:5000/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "A"}'
```

**Expected**: 400 with Problem Details:
```json
{
  "type": "https://yaaimg.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "full_name must be between 2 and 120 characters.",
  "errorCode": "VALIDATION_ERROR"
}
```

### Boundary — exactly 2 characters:

```bash
curl -X PATCH http://localhost:5000/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "JD"}'
```

**Expected**: 200 OK. Name accepted.

### Boundary — exactly 120 characters:

```bash
curl -X PATCH http://localhost:5000/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}'
```

**Expected**: 200 OK. Name accepted (120 chars).

---

## 7. Validate Data Isolation (SC-005, FR-012, FR-015)

1. Create **two** Supabase accounts (User A and User B)
2. Log in as User A, call `GET /me` — note the `user_id`
3. Log in as User B, call `GET /me` — note the different `user_id`

### RLS test via SQL (Supabase SQL Editor):

```sql
-- As User A (set JWT claims)
SET request.jwt.claims = '{"sub": "<user-a-id>"}';
SELECT * FROM profiles;
-- Should return only User A's row

SET request.jwt.claims = '{"sub": "<user-b-id>"}';
SELECT * FROM profiles WHERE user_id = '<user-a-id>';
-- Should return 0 rows
```

**Pass criteria**: 0% cross-user data access succeeds.

---

## 8. Validate Database Schema (SC-006, FR-014)

Run in Supabase SQL Editor:

```sql
-- Verify all 5 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'brands', 'brand_kits', 'provider_keys', 'generations');
```

**Expected**: 5 rows returned.

### Test constraint enforcement:

```sql
-- Should fail: full_name too short
UPDATE profiles SET full_name = 'A' WHERE user_id = '<user-id>';
-- Expected: CHECK constraint violation

-- Should fail: invalid avatar URL
UPDATE profiles SET avatar_url = 'not-a-url' WHERE user_id = '<user-id>';
-- Expected: CHECK constraint violation
```

**Pass criteria**: Invalid data is rejected by the database.

---

## 9. Validate Frontend UI (Account Settings Page)

1. Log in and navigate to `/account` (or equivalent settings page)
2. Verify email is displayed (read-only)
3. Update full name → Save → Refresh page → Name persists
4. Try invalid name (1 character) → Validation error shown
5. Log out → Verify redirect to login page

---

## 10. Validate Service Communication (SC-007)

1. Start both services (backend :5000, frontend :3000)
2. From the frontend, perform login → the frontend should proxy API calls to the backend
3. Navigate to account settings → profile data loads from the backend API

**Pass criteria**: Frontend and backend communicate successfully.

---

## Validation Checklist Summary

| # | Scenario | Success Criteria | Status |
|---|----------|-----------------|--------|
| 1 | Health check | Responds < 2s, status healthy | ☐ |
| 2 | Sign-up + email verification | Completes in < 3 min | ☐ |
| 3 | Auth redirect | 100% unauthenticated → login | ☐ |
| 4 | Profile auto-created | GET /me returns row for new user | ☐ |
| 5 | Profile update (happy) | Name persists after save | ☐ |
| 6 | Profile update (validation) | Short name rejected with 400 | ☐ |
| 7 | Data isolation (RLS) | 0% cross-user access | ☐ |
| 8 | Schema completeness | All 5 tables with constraints | ☐ |
| 9 | Frontend settings page | End-to-end profile flow | ☐ |
| 10 | Service communication | Frontend ↔ Backend works | ☐ |
