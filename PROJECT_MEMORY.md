# PROJECT_MEMORY.md — Session Memory

## Project: College Freshers' Day Counter
**Location:** `/home/raj/Documents/Intern projects/fresher's_counter/`

---

## Current Status

| Phase | Status |
|-------|--------|
| 1. Scaffolding | ✅ Complete |
| 2. Database Schema + Seed | ✅ Complete |
| 3. Login Page + JWT Auth | ✅ Complete |
| 4. Admin Dashboard | ✅ Complete |
| 5. Faculty Page | ✅ Complete |
| 6. API Routes (counts, users, sections) | ✅ Complete |
| 7. Documentation | ✅ Complete |

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
│   ├── layout.tsx              # Root layout (with Footer)
│   ├── page.tsx                # Login page (client component)
│   ├── globals.css             # Tailwind + custom vars
│   ├── api/auth/
│   │   ├── login/route.ts      # POST - authenticate + issue JWT
│   │   ├── me/route.ts         # GET - verify JWT, return user
│   │   └── logout/route.ts     # POST - clear JWT cookie
│   ├── api/
│   │   ├── counts/route.ts     # GET/POST - fetch/upsert counts
│   │   ├── users/route.ts      # GET/POST - list/create faculty
│   │   └── sections/route.ts   # GET - list all sections
│   ├── dashboard/page.tsx      # Admin dashboard (with counts + faculty)
│   └── faculty/page.tsx        # Faculty dashboard (edit own section)
├── components/
│   ├── CountsTable.tsx         # Editable counts table (admin)
│   ├── CreateFacultyModal.tsx  # Modal to create faculty
│   ├── FacultyCounts.tsx       # Faculty section count editor
│   └── Footer.tsx              # Global footer
├── config/departments.js       # DEPARTMENTS, DEPT_SHORT, DEPT_SECTIONS
├── lib/
│   ├── supabase.ts             # Supabase client + TypeScript types
│   ├── auth.ts                 # loginUser, createUser, hashPassword
│   └── token.ts                # generateToken, verifyToken (JWT, 2-day expiry)
├── middleware.ts                # Route protection, role-based redirects
supabase/
├── schema.sql                  # Full DB schema + section seeds
└── seed.js                     # Node script to seed admin user
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
4. Token set as httpOnly cookie via `cookies().set()` (Next.js 16 compatible)
5. Middleware verifies JWT on every request
6. Admin → redirected to `/dashboard`, Faculty → redirected to `/faculty`
7. Protected routes redirect to `/` if no valid token

---

## Key Decisions
- Sections are **fixed** (14 pre-seeded), but admin can add more if needed
- Common faculty password: `freshers@3128` (configurable via `FACULTY_DEFAULT_PASSWORD`)
- JWT expiry: **2 days**
- Cookie: httpOnly, SameSite=Lax
- Total column = student_count + additional_count (computed/generated in DB)

---

## All Phases Complete!

The application is fully functional with:
- Login page with JWT authentication
- Admin dashboard with full counts table + faculty management
- Faculty dashboard with section-specific count editing
- Global footer on all pages ("Build by Raj G AI DS II")

### Bug Fixes Applied:
- Fixed login redirect loop: Route Handlers must parse the raw `Cookie` header (`request.cookies` throws in Next.js 16); see FIX.md

### Potential Enhancements:
- Real-time updates with Supabase subscriptions
- Export counts to CSV/PDF
- Faculty can only edit their assigned section
- Password change functionality
- Admin can reset faculty passwords
