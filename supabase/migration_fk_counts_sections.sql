-- Migration: Add Foreign Key from counts to sections
-- Run this in Supabase SQL Editor
-- Ensures counts.department/section always reference a valid section

-- First, verify all existing counts have matching sections
SELECT c.department, c.section
FROM counts c
LEFT JOIN sections s
  ON c.department = s.department
 AND c.section = s.section_name
WHERE s.id IS NULL;

-- If the above returns rows, you must either:
-- 1. Add the missing sections to the sections table, OR
-- 2. Delete/update the orphaned counts
-- before adding the FK constraint.

-- Once data is clean, add the FK constraint:
ALTER TABLE counts
ADD CONSTRAINT fk_counts_sections
FOREIGN KEY (department, section)
REFERENCES sections(department, section_name)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'fk_counts_sections';