# PHASE.md — Implementation Plan

## Project: College Fresher's Day Registrations

A website for managing student registrations across departments during Fresher's Day celebrations.

---

## Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | set via `ADMIN_EMAIL` in `.env.local` | set via `ADMIN_PASSWORD` |
| Leadership | principal@act.edu.in, shhod@act.edu.in, deanadmin@act.edu.in, deanacademics@act.edu.in | freshers@3128 (common, auto-assigned) |
| Faculty | Admin-created emails | freshers@3128 (common, auto-assigned) |

> Faculty and leadership accounts do not require a password entry — the admin form / seed script
> auto-assigns `freshers@3128`. The admin account is seeded by `supabase/seed.js` using
> `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local` — never hardcode real credentials here.
> Leadership accounts are seeded by `supabase/seed-leadership.js` (requires
> `supabase/migration_leadership_roles.sql` to be applied first).

---

## Departments & Sections (Fixed)

| Department | Code | Sections |
|------------|------|----------|
| Computer Science & Engineering | CSE | A, B, C |
| Information Technology | IT | A, B |
| Electronics & Communication Engineering | ECE | A |
| Electrical & Electronics Engineering | EEE | A |
| Mechanical Engineering | MECH | A |
| Mechatronics Engineering | MHT | A |
| Civil Engineering | CIVIL | A |
| Biomedical Engineering | BME | A |
| Chemical Engineering | CME | A |
| Artificial Intelligence and Data Science | AI&DS | A, B |

**Total sections: 14**

---

## Phase 1: Project Scaffolding ✅

- Create Next.js app with TypeScript + Tailwind CSS
- Install dependencies: `supabase`, `bcryptjs`, `jsonwebtoken`
- Set up `.env.local` with Supabase credentials
- Configure `next.config.js`

**Files created:**
```
├── package.json
├── next.config.ts
├── .env.local
├── tsconfig.json
```

---

## Phase 2: Database Schema & Seed ✅

- Create Supabase project
- Create tables: `users`, `counts`, `sections`
- Seed admin account
- Seed 14 sections for all departments

**SQL Schema:**
```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
  department TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- counts table
CREATE TABLE counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  student_count INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  total INTEGER GENERATED ALWAYS AS (student_count + additional_count) STORED,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(department, section)
);

-- sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  section_name TEXT NOT NULL,
  UNIQUE(department, section_name)
);
```

**Seed Data:**
- Admin user (seeded via `supabase/seed.js` from env vars)
- 14 section rows for all departments

---

## Phase 3: Login Page ✅

- Build login form (email + password)
- Client-side validation
- Call `/api/auth/login` on submit
- Redirect to `/dashboard` for admin, `/faculty` for faculty
- Error handling for invalid credentials
- JWT token-based authentication

**Files:**
```
├── src/app/page.tsx                    # Login page
├── src/app/layout.tsx                  # Root layout
├── src/app/globals.css                 # Global styles
├── src/app/api/auth/login/route.ts     # Login API
├── src/app/api/auth/me/route.ts        # Session check API
├── src/app/api/auth/logout/route.ts    # Logout API
├── src/lib/token.ts                       # JWT token utilities (incl. getTokenFromRequest)
├── src/lib/auth.ts                        # Auth utilities
├── src/proxy.ts                           # Route protection (Next.js 16 proxy convention)
```

### JWT Token Flow
1. User submits email + password
2. Server validates credentials against `users` table
3. Server generates JWT token with user payload
4. Token stored as httpOnly cookie (2-day expiry)
5. Middleware verifies token on every request
6. Token contains: id, email, name, role, department, section

---

## Phase 4: Admin Dashboard ✅

- Display table: Department | Section | Students | Additional | Total
- Fetch all counts from `/api/counts`
- "Create Faculty" modal — asks only for **name, email, department, section**
  (server auto-assigns the common faculty password `freshers@3128`)
- Show all 14 sections with live counts
- Auto-refresh every 30s
- Polished UI: skeleton loading states, stat overview cards, inline row editing,
  consistent button/form vocabulary

**Files:**
```
├── src/app/dashboard/page.tsx          # Admin dashboard
├── src/components/CreateFacultyModal.tsx
├── src/components/CountsTable.tsx
```

---

## Phase 5: Faculty Page ✅

- Show assigned department and section only
- Form to enter student count + additional count
- Submit upserts to `counts` table
- Show current counts after submission

**Files:**
```
├── src/app/faculty/page.tsx            # Faculty entry page
├── src/components/FacultyCounts.tsx
```

---

## Phase 6: API Routes ✅

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Authenticate user, return JWT |
| `/api/auth/me` | GET | Get current user from JWT |
| `/api/auth/logout` | POST | Clear JWT cookie |
| `/api/counts` | GET | Fetch all counts (admin) or own count (faculty) |
| `/api/counts` | POST | Upsert count for a section |
| `/api/users` | GET | List all faculty (admin only) |
| `/api/users` | POST | Create faculty account (admin only, password auto-assigned: `freshers@3128`) |
| `/api/users/[id]` | DELETE | Delete faculty account (admin only; requires DELETE policy on users table — see FIX.md) |
| `/api/sections` | GET | List all sections |

**Files:**
```
├── src/app/api/auth/login/route.ts
├── src/app/api/auth/me/route.ts
├── src/app/api/auth/logout/route.ts
├── src/app/api/counts/route.ts
├── src/app/api/users/route.ts
├── src/app/api/users/[id]/route.ts
├── src/app/api/sections/route.ts
├── src/lib/supabase.ts
├── src/lib/token.ts
├── src/lib/auth.ts
```

---

## Phase 7: Documentation ✅

- Write `ARCHITECTURE.md`
- Write `PHASE.md` (this file)

---

## Deployment ✅

**Live: https://fresher-s-counter.vercel.app** (repo: gsraj0301/fresher-s-counter)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET` (generated via `openssl rand -base64 32`)
4. Deploy — auto-deploys on every push to main

> Note: per-deployment URLs (`<project>-<hash>-<team>.vercel.app`) may be SSO-protected;
> the production domain above is public.

---

## Summary

| Phase | Status |
|-------|--------|
| 1. Scaffolding | ✅ Complete |
| 2. Database Schema | ✅ Complete |
| 3. Login Page + JWT | ✅ Complete |
| 4. Admin Dashboard | ✅ Complete |
| 5. Faculty Page | ✅ Complete |
| 6. API Routes | ✅ Complete |
| 7. Documentation | ✅ Complete |
| 8. Deployment (Vercel) | ✅ Live |

---

## Post-Completion Fixes

See `FIX.md` for:
- The Next.js 16 login redirect-loop fix (Route Handlers must read cookies from the raw
  `Cookie` header; `middleware.ts` migrated to `proxy.ts`)
- The Supabase RLS DELETE policy required for faculty deletion
- Security hardening: proxy token extraction, production JWT_SECRET requirement,
  faculty scoped to own section on `/api/counts`, secure cookie flag, 0–1000 count
  validation (API + DB CHECK), FK `counts → sections`

---

## Post-Launch Feature: Leadership Roles ✅

Read-only dashboard for leadership, routed by role instead of hardcoded emails.

| Role | Home | Access |
|------|------|--------|
| admin | `/dashboard` | Counts editing + faculty CRUD |
| principal, hod, dean_admission, dean_academics | `/overview` | Read-only counts (all departments) |
| faculty | `/faculty` | Own section only |

**Files:**
```
├── supabase/migration_leadership_roles.sql   # Extends users.role CHECK constraint
├── supabase/seed-leadership.js               # Seeds the 4 leadership accounts
├── src/config/roles.ts                       # LEADERSHIP_ROLES, roleHome, canManageFaculty
├── src/app/overview/page.tsx                 # Read-only leadership dashboard
```

**Modified:** proxy.ts (role-based routing), CountsTable.tsx (`readOnly` prop),
login redirect via `roleHome`, `/api/users` GET restricted to admin,
`/api/counts` POST rejects leadership with 403.

**Gotcha:** the `users` table has no RLS UPDATE policy, so the seed script deletes and
re-inserts accounts instead of upserting (upserts silently fail on existing rows).
