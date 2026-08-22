# ARCHITECTURE.md — System Architecture

## Project: College Freshers' Day Counter

A web application for managing student headcount across departments during Fresher's Day celebrations.

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
│       └──────────────┼──────────────┘             │
│                      │                            │
└──────────────────────┼────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│              MIDDLEWARE (JWT Verification)        │
│                                                   │
│  Verify token on every request                    │
│  Redirect unauthorized to /login                 │
│  Role-based route protection                     │
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
  "role": "admin | faculty",
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

### Middleware Protection

Every request goes through middleware that:
1. Extracts JWT from cookie
2. Verifies signature against `JWT_SECRET`
3. Checks token expiry
4. Validates user role for route access
5. Redirects unauthorized users to login

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
Redirect: admin → /dashboard, faculty → /faculty
```

### Protected Route Flow
```
Request to /dashboard or /faculty
        │
        ▼
Middleware intercepts
        │
        ▼
Extract JWT from cookie
        │
        ▼
Verify token signature + expiry
        │
        ▼
Check user role matches route
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
Middleware verifies JWT
        │
        ▼
Upsert into counts table
(department + section unique)
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
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
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
  student_count INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  total INTEGER GENERATED ALWAYS AS (student_count + additional_count) STORED,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  UNIQUE(department, section)
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
fresher's_counter/
├── .env.local                    # Supabase + JWT credentials
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── ARCHITECTURE.md               # This file
├── PHASE.md                      # Implementation plan
├── supabase/
│   ├── schema.sql                # Database schema
│   └── seed.js                   # Seed script
├── public/                       # Static assets
│   └── ...
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Login page
│   │   ├── globals.css           # Global styles
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Admin dashboard
│   │   ├── faculty/
│   │   │   └── page.tsx          # Faculty page
│   │   └── api/                  # API routes
│   │       ├── auth/
│   │       │   ├── login/route.ts    # Login + JWT issue
│   │       │   ├── me/route.ts       # Get current user
│   │       │   └── logout/route.ts   # Clear JWT
│   │       ├── counts/route.ts
│   │       ├── users/route.ts
│   │       └── sections/route.ts
│   ├── components/               # Reusable components
│   ├── config/
│   │   └── departments.js        # Department data
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── auth.ts               # Auth utilities
│   │   └── token.ts              # JWT utilities
│   └── middleware.ts             # Route protection
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# JWT
JWT_SECRET=your-secret-key-here
```

---

## Security Considerations

- **Passwords**: Hashed with bcrypt (10 salt rounds)
- **JWT Tokens**: Signed with HMAC-SHA256
- **HTTP-only Cookies**: Prevent XSS attacks
- **SameSite=Lax**: CSRF protection
- **Role-based Access**: Middleware enforces route permissions
- **Environment Variables**: Secrets never committed to repo
- **Token Expiry**: 2-day automatic logout

---

## Deployment

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET` (generate a strong random string)
4. Deploy automatically on push to main branch
