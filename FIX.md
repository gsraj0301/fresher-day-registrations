# FIX.md — Login Redirect Loop on Next.js 16

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

## Production

- **Live URL:** https://fresher-s-counter.vercel.app
- **Repo:** https://github.com/gsraj0301/fresher-s-counter
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET`
- Per-deployment preview URLs may be SSO-protected ("Protected deployment" 401);
  the production domain above is public.
