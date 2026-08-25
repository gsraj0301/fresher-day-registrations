# FIX.md — Login Redirect Loop on Next.js 16 + Security Hardening

## Problem

Login succeeds (`POST /api/auth/login` → 200) but the user immediately ends up back at the login page.

```
GET / 200                          ← login page
POST /api/auth/login 200           ← login OK
GET / 307                          ← proxy redirects / → /dashboard
GET / 200                          ← back at login page (?)
POST /api/auth/login 200           ← user retries
```

## Root Cause

Two Next.js 16 issues:

### 1. Route Handlers can't read cookies — `cookies()` from `next/headers` AND `request.cookies` both fail

With Next.js 16's proxy system, `await cookies()` inside Route Handlers did not return the request cookie. The proxy/middleware could see the token (hence the working 307 redirect), but every protected API route (`/api/auth/me`, `/api/users`, `/api/counts`, `/api/sections`) read `token` as missing → returned 401 → dashboard's `fetchUser()` called `router.push('/')` → redirect loop.

Additionally, reading via the documented `request.cookies.get('token')` on the Route Handler's request object **threw an exception** (500s), so even the NextRequest API was not usable here.

The only reliable method: parse the raw **`Cookie` header** manually:

```ts
const cookie = request.headers.get('cookie');
```

### 2. `middleware.ts` convention is deprecated → renamed to `proxy`

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

The file must now be `proxy.ts` exporting a function named `proxy` (see docs `03-file-conventions/proxy.md`).

## Fix Applied

1. **`src/lib/token.ts`** — added helper that parses the raw `Cookie` header (works with plain `Request`, no dependency on `next/headers` or `request.cookies`):
   ```ts
   export function getTokenFromRequest(request: Request): string | null {
     const cookie = request.headers.get('cookie');
     if (!cookie) return null;
     for (const part of cookie.split(';')) {
       const [name, ...rest] = part.trim().split('=');
       if (name === 'token') return decodeURIComponent(rest.join('='));
     }
     return null;
   }
   ```

2. **All protected API routes** now accept the request and use `getTokenFromRequest(request)` instead of `cookies()` from `next/headers`. Responses switched from `Response.json()` to `NextResponse.json()`:
   - `src/app/api/auth/me/route.ts`
   - `src/app/api/users/route.ts`
   - `src/app/api/counts/route.ts`
   - `src/app/api/sections/route.ts`

3. **`src/middleware.ts` → `src/proxy.ts`** — renamed file and export (`middleware` → `proxy`). Logic unchanged.

4. **Auth routes set/clear cookies on `NextResponse`** (kept from earlier attempt):
   - Login: `response.cookies.set('token', ...)` on a `NextResponse.json()` body
   - Logout: `response.cookies.delete('token')` on a `NextResponse.json()` body

## Verified

```
POST /api/auth/login 200           ← Set-Cookie present on response
GET /api/auth/me 200 (with cookie) ← token read from Cookie header
GET /api/users 200                 ← faculty list loads
GET /api/counts 200                ← counts load
GET /api/sections 200              ← sections load
GET /dashboard 200                 ← proxy allows admin through
GET / 307 (with cookie)            ← logged-in user redirected to dashboard
GET /api/auth/me 401→307 (no cookie)
```

TypeScript: `npx tsc --noEmit` passes.

---

## Addendum: Faculty delete blocked by RLS — RESOLVED ✅

**Symptom:** `DELETE /api/users/:id` returned success but the user remained in the database.

**Cause:** The `users` table has RLS enabled with SELECT/INSERT policies only — no DELETE policy. Supabase filters the delete to 0 rows without raising an error.

**Fix (applied):** Run in the Supabase SQL Editor (Dashboard → SQL Editor):

```sql
CREATE POLICY "Allow authenticated delete on users" ON users
    FOR DELETE USING (true);
```

This policy is also included in `supabase/schema.sql` for fresh setups. The route now
detects 0-row deletes and returns a clear error instead of a false success.
Verified working on production (2026-08-22): create → delete → user gone.

---

## Addendum: Security Hardening & Bug Fixes (2026-08-24) ✅

### 1. Proxy token extraction fixed
**Issue:** `src/proxy.ts` used `request.cookies.get('token')` which throws in Next.js 16 Route Handlers.
**Fix:** Changed to use `getTokenFromRequest(request)` from `@/lib/token` (parses raw `Cookie` header).
**File:** `src/proxy.ts:6`

### 2. JWT Secret fallback removed in production
**Issue:** Hardcoded fallback `'fresher-day-registrations-dev-secret'` allowed token forgery if `JWT_SECRET` missing.
**Fix:** Throw error in production if `JWT_SECRET` not set; warn only in development.
**File:** `src/lib/token.ts:3-14`

### 3. Faculty authorization on counts POST
**Issue:** Faculty could submit counts for any department/section, not just their assigned one.
**Fix:** Added role check in `/api/counts` POST — faculty restricted to their own `department` + `section`.
**File:** `src/app/api/counts/route.ts:55-63`

### 4. Secure cookie flag added
**Issue:** Login cookie missing `secure: true` in production.
**Fix:** Added `secure: process.env.NODE_ENV === 'production'` to cookie options.
**File:** `src/app/api/auth/login/route.ts:50`

### 5. Server-side count validation (0–1000)
**Issue:** No upper bound on student/additional counts.
**Fix:** Added validation in API (0–1000) and DB CHECK constraints.
**Files:** `src/app/api/counts/route.ts:55-63`, `supabase/schema.sql` (student_count/additional_count CHECK)

### 6. Foreign Key: counts → sections
**Issue:** `counts` had no FK to `sections` — orphan counts possible.
**Fix:** Added FK constraint in schema and migration file.
**Files:** `supabase/schema.sql` (FK on counts), `supabase/migration_fk_counts_sections.sql`

---

## Production

- **Live URL:** https://fresher-day-registrations.vercel.app
- **Repo:** https://github.com/gsraj0301/fresher-day-registrations
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET`
- Per-deployment preview URLs may be SSO-protected ("Protected deployment" 401);
  the production domain above is public.
