-- ============================================
-- College Freshers' Day Counter - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'faculty')),
    department TEXT,
    section TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. SECTIONS TABLE (Fixed - 14 sections)
-- ============================================
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department TEXT NOT NULL,
    section_name TEXT NOT NULL,
    UNIQUE(department, section_name)
);

-- ============================================
-- 3. COUNTS TABLE
-- ============================================
CREATE TABLE counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department TEXT NOT NULL,
    section TEXT NOT NULL,
    student_count INTEGER DEFAULT 0 CHECK (student_count >= 0 AND student_count <= 1000),
    additional_count INTEGER DEFAULT 0 CHECK (additional_count >= 0 AND additional_count <= 1000),
    total INTEGER GENERATED ALWAYS AS (student_count + additional_count) STORED,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES users(id),
    UNIQUE(department, section),
    FOREIGN KEY (department, section) REFERENCES sections(department, section_name)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_counts_department ON counts(department);
CREATE INDEX idx_counts_section ON counts(section);
CREATE INDEX idx_sections_department ON sections(department);

-- ============================================
-- 5. SEED SECTIONS (14 total)
-- ============================================
INSERT INTO sections (department, section_name) VALUES
-- CSE: A, B, C (3)
('Computer Science & Engineering', 'A'),
('Computer Science & Engineering', 'B'),
('Computer Science & Engineering', 'C'),
-- IT: A, B (2)
('Information Technology', 'A'),
('Information Technology', 'B'),
-- ECE: A (1)
('Electronics & Communication Engineering', 'A'),
-- EEE: A (1)
('Electrical & Electronics Engineering', 'A'),
-- MECH: A (1)
('Mechanical Engineering', 'A'),
-- MHT: A (1)
('Mechatronics Engineering', 'A'),
-- CIVIL: A (1)
('Civil Engineering', 'A'),
-- BME: A (1)
('Biomedical Engineering', 'A'),
-- CME: A (1)
('Chemical Engineering', 'A'),
-- AI&DS: A, B (2)
('Artificial Intelligence and Data Science', 'A'),
('Artificial Intelligence and Data Science', 'B');

-- ============================================
-- 6. SEED ADMIN USER
-- Password: Agnish@3128 (hashed with bcrypt)
-- Run the seed script to insert the admin user
-- ============================================
-- The admin user will be created via the seed script
-- because we need bcrypt hashing which can't be done in SQL.

-- ============================================
-- 7. ENABLE ROW LEVEL SECURITY (Optional)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE counts ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust as needed)
CREATE POLICY "Allow public read access on sections" ON sections
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on counts" ON counts
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on counts" ON counts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on counts" ON counts
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated insert on users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated delete on users" ON users
    FOR DELETE USING (true);
