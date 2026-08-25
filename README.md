# Fresher's Day Registrations

A web application for managing student registrations across departments during a college's Fresher's Day celebrations.

Admins get a live overview of every department and section; faculty sign in and update the count for their assigned section in one place.

**Live: [fresher-day-registrations.vercel.app](https://fresher-day-registrations.vercel.app)**

## Features

- **JWT authentication** — bcrypt-hashed passwords, httpOnly cookie sessions (2-day expiry)
- **Role-based access** — admins manage everything (counts + faculty CRUD); leadership roles (`principal`, `hod`, `dean_admission`, `dean_academics`) get a read-only `/overview` dashboard; faculty can only edit their own department/section
- **Live registration table** — inline editing (Enter to save, Esc to cancel), computed totals, relative "last updated" timestamps
- **Faculty management** — create faculty accounts (shared password auto-assigned server-side) and delete them with an inline confirm
- **10 departments, 14 sections** pre-configured

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | bcryptjs + JWT (httpOnly cookies) |
| Hosting | Vercel |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Create a project on [Supabase](https://supabase.com), then run the schema in the SQL Editor:

```bash
supabase/schema.sql
```

> If you plan to delete users from the app, also add the DELETE policy noted at the bottom of `schema.sql`.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase URL/anon key and set `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then seed the admin account:

```bash
node supabase/seed.js
```

To seed the read-only leadership accounts (principal, HOD, deans), first run `supabase/migration_leadership_roles.sql` in the Supabase SQL Editor, then:

```bash
node supabase/seed-leadership.js
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Login page
│   ├── dashboard/page.tsx        # Admin dashboard (counts + faculty management)
│   ├── faculty/page.tsx          # Faculty page (edit own section count)
│   └── api/                      # Route handlers (auth, counts, users, sections)
├── components/                   # CountsTable, FacultyCounts, CreateFacultyModal, Footer
├── config/departments.js         # Department/section data
├── lib/                          # supabase client, auth helpers, JWT utilities
└── proxy.ts                      # Route protection (Next.js 16 proxy convention)
supabase/
├── schema.sql                    # Tables + RLS policies + section seeds
└── seed.js                       # Seeds the admin user
```

More detail in [ARCHITECTURE.md](./ARCHITECTURE.md); implementation notes in [PHASE.md](./PHASE.md).

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `JWT_SECRET` | Yes in production | Signs session tokens — use a long random string |
| `FACULTY_DEFAULT_PASSWORD` | No | Shared password for new faculty accounts |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed only | Used by `supabase/seed.js` |

## Deploying to Vercel

**Already deployed ✅ — https://fresher-day-registrations.vercel.app** (auto-deploys on push to `main`).

For a fresh deployment:

1. Push this repo to GitHub
2. Import it in [Vercel](https://vercel.com/new)
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET`)
4. Deploy

> Per-deployment URLs (`<project>-<hash>-<team>.vercel.app`) may be SSO-protected;
> use the production domain, or disable Deployment Protection under
> Project → Settings → Deployment Protection.

**Important:** In Supabase, restrict database access for production — enable RLS policies appropriate for public deployment and never reuse local development secrets.

---

Built by Raj G, AI & DS.
