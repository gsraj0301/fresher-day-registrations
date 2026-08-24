-- Migration: Add leadership roles (principal, hod, dean_admission, dean_academics)
-- Run this in Supabase SQL Editor

ALTER TABLE users DROP CONSTRAINT users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'principal', 'hod', 'dean_admission', 'dean_academics', 'faculty'));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'users_role_check';

-- Then seed the accounts:
--   node supabase/seed-leadership.js
