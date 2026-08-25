# PROJECT_MEMORY.md — Session Memory

## Project: College Fresher's Day Registrations
**Location:** `/home/raj/Documents/Intern projects/fresher's_counter/`

---

## Current Status

**Deployed ✅ — https://fresher-day-registrations.vercel.app** (repo: gsraj0301/fresher-day-registrations)

| Phase | Status |
|-------|--------|
| 1. Scaffolding | ✅ Complete |
| 2. Database Schema + Seed | ✅ Complete |
| 3. Login Page + JWT Auth | ✅ Complete |
| 4. Admin Dashboard | ✅ Complete |
| 5. Faculty Page | ✅ Complete |
| 6. API Routes (counts, users, sections) | ✅ Complete |
| 7. Documentation | ✅ Complete |
| 8. Deployment (Vercel) | ✅ Live |

**Vercel env vars set:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET` (generated via `openssl rand -base64 32`).

---

## Tech Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** bcryptjs + JWT (jsonwebtoken)
- **Hosting:** Vercel

---

## Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | set via `ADMIN_EMAIL` in `.env.local` | set via `ADMIN_PASSWORD` |
| Faculty | Admin-created | `freshers@3128` (common, auto-assigned) |

**Supabase:**
- URL + anon key are in `.env.local` (never committed)
- JWT_SECRET must be set via env var in production (fallback exists for local dev only)

**Cookie Handling (Next.js 16):**
- `cookies()` from `next/headers` does NOT return cookies inside Route Handlers
- Even `request.cookies.get()` throws there — parse the raw `Cookie` header instead (`getTokenFromRequest` in `src/lib/token.ts`)
- Set/clear cookies via `NextResponse.json(...)` + `response.cookies.set()/delete()`
- Route protection lives in `src/proxy.ts` (Next.js 16 replaced `middleware.ts` with `proxy.ts`)

---

## Departments & Sections (14 total)
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

---

## Database Tables (already created in Supabase)
1. **users** — id, email, name, password_hash, role (admin/faculty), department, section, created_at
2. **counts** — id, department, section, student_count, additional_count, total (computed), updated_at, updated_by
3. **sections** — id, department, section_name (14 rows seeded)

---

## Files Created So Far

```
src/
├── app/
│   ├── layout.tsx                # Root layout (with Footer)
│   ├── page.tsx                  # Login page (client component)
│   ├── globals.css               # Tailwind + custom vars + animations
│   ├── api/auth/
│   │   ├── login/route.ts        # POST - authenticate + issue JWT
│   │   ├── me/route.ts           # GET - verify JWT, return user
│   │   └── logout/route.ts       # POST - clear JWT cookie
│   ├── api/
│   │   ├── counts/route.ts       # GET/POST - fetch/upsert counts
│   │   ├── users/route.ts        # GET/POST - list/create faculty
│   │   ├── users/[id]/route.ts   # DELETE - remove faculty (admin)
│   │   └── sections/route.ts     # GET - list all sections
│   ├── dashboard/page.tsx        # Admin dashboard (counts + faculty mgmt)
│   └── faculty/page.tsx          # Faculty dashboard (edit own section)
├── components/
│   ├── CountsTable.tsx           # Editable counts table (admin)
│   ├── CreateFacultyModal.tsx    # Modal to create faculty (no password field)
│   ├── FacultyCounts.tsx         # Faculty section count editor
│   └── Footer.tsx                # Global footer
├── config/departments.js         # DEPARTMENTS, DEPT_SHORT, DEPT_SECTIONS
├── lib/
│   ├── supabase.ts               # Supabase client + TypeScript types
│   ├── auth.ts                   # loginUser, createUser, hashPassword, FACULTY_DEFAULT_PASSWORD
│   └── token.ts                  # generateToken, verifyToken, getTokenFromRequest
├── proxy.ts                       # Route protection (Next.js 16 proxy convention)
supabase/
├── schema.sql                    # Full DB schema + RLS policies + section seeds
└── seed.js                       # Node script to seed admin user (env-driven)
```

---

## Running Locally

```bash
npm run dev
# Server runs at http://localhost:3000
```

---

## Auth Flow
1. User submits email + password on `/` (login page)
2. `POST /api/auth/login` validates credentials via Supabase
3. Server generates JWT (2-day expiry) with user payload
4. Token set as httpOnly cookie via `NextResponse` + `response.cookies.set()`
5. `src/proxy.ts` verifies JWT on every request (parses raw Cookie header)
6. Admin → redirected to `/dashboard`, Faculty → redirected to `/faculty`
7. Protected routes redirect to `/` if no valid token

---

## Key Decisions
- Sections are **fixed** (14 pre-seeded), but admin can add more if needed
- Common faculty password: `freshers@3128` (configurable via `FACULTY_DEFAULT_PASSWORD`)
- JWT expiry: **2 days**
- Cookie: httpOnly, SameSite=Lax, Secure in production
- Total column = student_count + additional_count (computed/generated in DB)
- Roles live in DB (`admin`, `principal`, `hod`, `dean_admission`, `dean_academics`, `faculty`) — **no hardcoded emails**; single source of truth is `src/config/roles.ts`
- Leadership sees read-only `/overview`; proxy routes each role to its home via `roleHome()`
- Counts bounded 0–1000 (API + DB CHECK); `counts` FK to `sections`
- Production throws at boot if `JWT_SECRET` missing (dev fallback only)
- `users` table has no RLS UPDATE policy → seed scripts must delete + insert, never upsert

---

## All Phases Complete — Deployed!

The application is live at **https://fresher-day-registrations.vercel.app** with:
- Login page with JWT authentication
- Admin dashboard with full counts table + faculty management (create + delete)
- Leadership `/overview` dashboard (read-only counts for principal/HOD/deans)
- Faculty dashboard with section-specific count editing (with error feedback)
- Global footer on all pages ("Build by Raj G AI DS II")

### Bug Fixes Applied:
- Fixed login redirect loop: Route Handlers must parse the raw `Cookie` header (`request.cookies` throws in Next.js 16); see FIX.md
- Migrated `middleware.ts` → `proxy.ts` (Next.js 16 convention)
- Faculty deletion requires a Supabase RLS DELETE policy on `users` (see FIX.md)
- Security hardening (2026-08-24): proxy uses `getTokenFromRequest`, JWT_SECRET required in production, faculty scoped to own section server-side, secure cookie flag, 0–1000 count limits (API + CHECK constraints), FK `counts → sections` (see FIX.md)
- Added missing "Create Faculty" trigger button on admin dashboard
- Sticky footer: pages use `min-h-full` instead of `min-h-screen` so the layout flex chain keeps the footer visible on short pages
- Leadership seed script rewritten to delete+insert (upsert fails silently without an UPDATE policy)

### Potential Enhancements:
- Real-time updates with Supabase subscriptions
- Export counts to CSV/PDF
- Faculty can only edit their assigned section
- Password change functionality
- Admin can reset faculty passwords
