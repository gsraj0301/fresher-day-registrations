# ARCHITECTURE.md — System Architecture

## Project: College Fresher's Day Registrations

A web application for managing student registrations across departments during Fresher's Day celebrations.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 (App Router) | React-based UI with server components |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Database | Supabase (PostgreSQL) | Cloud-hosted relational database |
| Auth | bcryptjs + JWT | Password hashing + token-based authentication |
| Hosting | Vercel | Serverless deployment platform |
| Language | TypeScript | Type-safe JavaScript |

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                    CLIENT                        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Login   │  │  Admin   │  │ Faculty  │      │
│  │   Page   │  │Dashboard │  │   Page   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │             │
│       │         ┌────▼─────┐        │             │
│       │         │Leadership│        │             │
│       │         │ Overview │        │             │
│       │         │(/overview)│       │             │
│       │         └────┬─────┘        │             │
│       └──────────────┼──────────────┘             │
│                      │                            │
└──────────────────────┼────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│               PROXY (JWT Verification)            │
│                                                   │
│  src/proxy.ts (Next.js 16 proxy convention)       │
│  Verify token on every request                    │
│  Redirect unauthorized to /                       │
│  Role-based route protection                      │
│                                                   │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│                  API LAYER                        │
│                                                   │
│  /api/auth/login   → Authenticate + issue JWT     │
│  /api/auth/me      → Get current user from JWT    │
│  /api/auth/logout  → Clear JWT cookie             │
│  /api/counts       → CRUD for student counts      │
│  /api/users        → Create/manage faculty        │
│  /api/users/[id]   → Delete faculty (admin)       │
│  /api/sections     → List sections                │
│                                                   │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│                SUPABASE                           │
│                                                   │
│  ┌────────┐  ┌────────┐  ┌──────────┐           │
│  │ users  │  │ counts │  │ sections │           │
│  └────────┘  └────────┘  └──────────┘           │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Authentication & Tokenization

### JWT Token Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Server    │     │  Supabase   │
│  (Browser)  │     │  (Next.js)  │     │ (Database)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. POST /login   │                   │
       │  {email, password}│                   │
       │──────────────────>│                   │
       │                   │  2. Query user    │
       │                   │──────────────────>│
       │                   │  3. Return user   │
       │                   │<──────────────────│
       │                   │                   │
       │                   │  4. Verify password
       │                   │  (bcrypt.compare) │
       │                   │                   │
       │                   │  5. Generate JWT  │
       │                   │  {id, email,      │
       │                   │   role, dept...}  │
       │                   │                   │
       │  6. Set-Cookie:   │                   │
       │  token=<JWT>      │                   │
       │<──────────────────│                   │
       │                   │                   │
       │  7. Redirect      │                   │
       │  /dashboard       │                   │
       │──────────────────>│                   │
       │                   │                   │
```

### JWT Token Structure

```json
{
  "id": "uuid",
  "email": "user@college.edu",
  "name": "User Name",
  "role": "admin | principal | hod | dean_admission | dean_academics | faculty",
  "department": "Computer Science & Engineering",
  "section": "A",
  "iat": 1787303306,
  "exp": 2102879306
}
```

### Token Storage

- **Location**: HTTP-only cookie named `token`
- **Expiry**: 2 days (172800 seconds)
- **Security**: HttpOnly, SameSite=Lax, Path=/
- **Not accessible via JavaScript** (prevents XSS)

### Proxy Protection

Every request goes through `src/proxy.ts` (Next.js 16 replaced `middleware.ts` with the proxy convention — the file must export a function named `proxy`) that:
1. Extracts JWT from the raw `Cookie` header
2. Verifies signature against `JWT_SECRET`
3. Checks token expiry
4. Resolves the user's home route from role (`roleHome` in `src/config/roles.ts`): admin → `/dashboard`, leadership → `/overview`, faculty → `/faculty`
5. Redirects users who request pages outside their own home route prefix (`/api/*` allowed for all — authorization enforced per-endpoint)
6. Redirects unauthenticated users to login

> **Next.js 16 note:** Inside Route Handlers, `cookies()` from `next/headers` returns nothing and even
> `request.cookies.get()` throws — cookies must be parsed from `request.headers.get('cookie')`
> manually (see `getTokenFromRequest` in `src/lib/token.ts`). Details in FIX.md.

### Roles & Access

Single source of truth: `src/config/roles.ts`.

| Role | Home route | Counts view | Edit counts | Manage faculty |
|------|-----------|-------------|-------------|----------------|
| admin | `/dashboard` | All departments | ✅ Any section | ✅ |
| principal | `/overview` | All departments | ❌ (read-only) | ❌ |
| hod (S&H HOD) | `/overview` | All departments | ❌ (read-only) | ❌ |
| dean_admission | `/overview` | All departments | ❌ (read-only) | ❌ |
| dean_academics | `/overview` | All departments | ❌ (read-only) | ❌ |
| faculty | `/faculty` | Own section only | ✅ Own section only | ❌ |

Leadership accounts are seeded via `supabase/seed-leadership.js`; there are no hardcoded emails in application code.

### Password Security

- **Hashing**: bcrypt with 10 salt rounds
- **Storage**: Only hashed passwords in database
- **Verification**: `bcrypt.compare()` during login

---

## Data Flow

### Login Flow
```
User enters credentials
        │
        ▼
POST /api/auth/login
        │
        ▼
Validate against users table (Supabase)
        │
        ▼
Verify password with bcrypt
        │
        ▼
Generate JWT token (2-day expiry)
        │
        ▼
Set httpOnly cookie with token
        │
        ▼
Redirect by role (roleHome):
admin → /dashboard, leadership → /overview, faculty → /faculty
```

### Protected Route Flow
```
Request to /dashboard, /overview or /faculty
        │
        ▼
Proxy intercepts
        │
        ▼
Extract JWT from Cookie header
        │
        ▼
Verify token signature + expiry
        │
        ▼
Resolve role home route; redirect if path outside it
        │
        ▼
Allow or redirect
```

### Count Submission Flow (Faculty)
```
Faculty enters counts
        │
        ▼
POST /api/counts (with JWT)
        │
        ▼
Route handler verifies JWT + role
(faculty restricted to own dept/section,
 leadership rejected 403, counts 0–1000)
        │
        ▼
Upsert into counts table
(department + section unique, FK to sections)
        │
        ▼
Return updated count
```

### Admin View Flow
```
Admin loads dashboard
        │
        ▼
GET /api/counts (with JWT)
        │
        ▼
Middleware verifies admin role
        │
        ▼
Fetch all counts from Supabase
        │
        ▼
Display table: Dept | Section | Students | Additional | Total
```

---

## Database Schema

### users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'principal', 'hod', 'dean_admission', 'dean_academics', 'faculty')),
  department TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### counts Table
```sql
CREATE TABLE counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  student_count INTEGER DEFAULT 0 CHECK (student_count >= 0 AND student_count <= 1000),
  additional_count INTEGER DEFAULT 0 CHECK (additional_count >= 0 AND additional_count <= 1000),
  total INTEGER GENERATED ALWAYS AS (student_count + additional_count) STORED,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(department, section),
  FOREIGN KEY (department, section) REFERENCES sections(department, section_name)
);
```

### sections Table
```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  section_name TEXT NOT NULL,
  UNIQUE(department, section_name)
);
```

---

## Departments & Sections

| Department | Code | Sections | Total |
|------------|------|----------|-------|
| Computer Science & Engineering | CSE | A, B, C | 3 |
| Information Technology | IT | A, B | 2 |
| Electronics & Communication Engineering | ECE | A | 1 |
| Electrical & Electronics Engineering | EEE | A | 1 |
| Mechanical Engineering | MECH | A | 1 |
| Mechatronics Engineering | MHT | A | 1 |
| Civil Engineering | CIVIL | A | 1 |
| Biomedical Engineering | BME | A | 1 |
| Chemical Engineering | CME | A | 1 |
| Artificial Intelligence and Data Science | AI&DS | A, B | 2 |
| **Total** | | | **14** |

---

## Project Structure

```
fresher-day-registrations/
├── .env.local                    # Supabase + JWT credentials (not committed)
├── .env.example                  # Template for required env vars
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── ARCHITECTURE.md               # This file
├── PHASE.md                      # Implementation plan
├── FIX.md                        # Bug fixes & Next.js 16 gotchas
├── supabase/
│   ├── schema.sql                # Database schema + RLS policies
│   ├── seed.js                   # Admin seed script (env-driven)
│   ├── seed-leadership.js        # Seeds principal/HOD/dean accounts
│   ├── migration_leadership_roles.sql  # Adds leadership roles to CHECK constraint
│   └── migration_fk_counts_sections.sql# Adds FK counts → sections
├── public/                       # Static assets
│   └── ...
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (sticky footer via flex)
│   │   ├── page.tsx              # Login page
│   │   ├── globals.css           # Global styles + animations
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Admin dashboard (counts + faculty mgmt)
│   │   ├── overview/
│   │   │   └── page.tsx          # Leadership read-only dashboard
│   │   ├── faculty/
│   │   │   └── page.tsx          # Faculty page (own section count)
│   │   └── api/                  # API routes
│   │       ├── auth/
│   │       │   ├── login/route.ts    # Login + JWT issue
│   │       │   ├── me/route.ts       # Get current user
│   │       │   └── logout/route.ts   # Clear JWT
│   │       ├── counts/route.ts       # GET all / POST upsert (role-checked)
│   │       ├── users/route.ts        # GET list / POST create (admin only)
│   │       ├── users/[id]/route.ts   # DELETE faculty (admin)
│   │       └── sections/route.ts     # GET list sections
│   ├── components/
│   │   ├── CountsTable.tsx       # Counts table (readOnly prop for overview)
│   │   ├── FacultyCounts.tsx     # Faculty section count editor
│   │   ├── CreateFacultyModal.tsx# Faculty creation modal
│   │   └── Footer.tsx            # Global footer
│   ├── config/
│   │   ├── departments.js        # DEPARTMENTS, DEPT_SHORT, DEPT_SECTIONS
│   │   └── roles.ts              # Role types, roleHome, LEADERSHIP_ROLES
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client + types
│   │   ├── auth.ts               # Auth utilities, FACULTY_DEFAULT_PASSWORD
│   │   └── token.ts              # JWT utilities + getTokenFromRequest
│   └── proxy.ts                  # Route protection (Next.js 16 proxy)
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# JWT
JWT_SECRET=your-secret-key-here

# Optional — shared password for new faculty accounts
FACULTY_DEFAULT_PASSWORD=freshers@3128

# Seed script only (supabase/seed.js)
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=...
ADMIN_NAME=Admin
```

---

## Security Considerations

- **Passwords**: Hashed with bcrypt (10 salt rounds)
- **JWT Tokens**: Signed with HMAC-SHA256; production refuses to boot without `JWT_SECRET`
- **HTTP-only Cookies**: Prevent XSS attacks; `Secure` flag in production
- **SameSite=Lax**: CSRF protection
- **Role-based Access**: Proxy enforces route permissions (`src/config/roles.ts`); APIs re-check per endpoint
- **Input Validation**: Counts bounded 0–1000 server-side and via DB CHECK constraints
- **Data Integrity**: `counts.department/section` FK to `sections`
- **Environment Variables**: Secrets never committed to repo
- **Token Expiry**: 2-day automatic logout

---

## Deployment

**Status: Deployed ✅ — https://fresher-day-registrations.vercel.app**

1. Push code to GitHub repository (gsraj0301/fresher-day-registrations)
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET` (generate a strong random string)
4. Deploy automatically on push to main branch

> Vercel's per-deployment URLs (e.g. `<project>-<hash>-<team>.vercel.app`) may be
> SSO-protected; the production domain `fresher-day-registrations.vercel.app` is public.
> If Deployment Protection blocks public visitors, disable it under
> Project → Settings → Deployment Protection.
