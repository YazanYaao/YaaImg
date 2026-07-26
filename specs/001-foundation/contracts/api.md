# API Contracts: Foundation

**Feature**: `001-foundation` | **Date**: 2026-07-09

> Only endpoints implemented in Phase 1 (Foundation) are documented here.
> Brand CRUD, keys, kit, generation, and admin endpoints come in later phases.

---

## Authentication

All endpoints except `GET /health` require a valid Supabase JWT:

```
Authorization: Bearer <supabase_access_token>
```

The backend extracts `sub` (user ID) from the validated token. No user-supplied IDs are trusted.

---

## Error Format (RFC 9457 Problem Details)

All error responses use this structure:

```json
{
  "type": "https://yaaimg.com/errors/{error-type}",
  "title": "Human Readable Title",
  "status": 400,
  "detail": "Specific explanation of what went wrong.",
  "traceId": "00-abc123-def456-01",
  "errorCode": "VALIDATION_ERROR"
}
```

### Standard Error Codes

| HTTP Status | errorCode | When |
|-------------|-----------|------|
| 400 | `VALIDATION_ERROR` | Request body fails validation |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Valid JWT but insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist or user has no access |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Endpoints

### GET /health

Health check. No authentication required.

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-07-09T12:00:00Z"
}
```

**Response**: `503 Service Unavailable`
```json
{
  "status": "unhealthy",
  "timestamp": "2026-07-09T12:00:00Z"
}
```

---

### GET /me

Retrieve the authenticated user's profile.

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane@example.com",
  "full_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.png",
  "created_at": "2026-01-28T00:00:00Z",
  "updated_at": "2026-01-28T00:00:00Z"
}
```

**Notes**:
- `email` is read from the Supabase auth user record, not the profiles table
- Profile row is guaranteed to exist (created by DB trigger on sign-up)
- `full_name` and `avatar_url` may be `null` if not yet set

**Errors**:
| Status | errorCode | Condition |
|--------|-----------|-----------|
| 401 | `UNAUTHORIZED` | Missing/invalid token |

---

### PATCH /me

Update the authenticated user's profile.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "full_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.png"
}
```

**Validation Rules**:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `full_name` | string \| null | No | If provided and non-null: trimmed length 2–120 characters |
| `avatar_url` | string \| null | No | If provided and non-null: must match `^https?://.+` |

- Both fields are optional. Only provided fields are updated (partial update).
- Sending `null` for a field clears it.
- Sending an empty object `{}` is valid (no-op).

**Response**: `200 OK`
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane@example.com",
  "full_name": "Jane Doe",
  "avatar_url": "https://example.com/avatar.png",
  "created_at": "2026-01-28T00:00:00Z",
  "updated_at": "2026-07-09T12:00:00Z"
}
```

**Errors**:

| Status | errorCode | Condition |
|--------|-----------|-----------|
| 400 | `VALIDATION_ERROR` | `full_name` too short/long, or `avatar_url` invalid format |
| 401 | `UNAUTHORIZED` | Missing/invalid token |

**Example validation error**:
```json
{
  "type": "https://yaaimg.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "full_name must be between 2 and 120 characters.",
  "traceId": "00-abc123-def456-01",
  "errorCode": "VALIDATION_ERROR"
}
```
