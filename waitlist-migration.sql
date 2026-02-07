-- ============================================
-- Waitlist Table for Pre-Launch Landing Page
-- ============================================
-- Run this on your Supabase project to create the waitlist table.
-- Can also be added as a migration in the main project:
--   supabase/migrations/025_waitlist.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the landing page)
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only allow service role to read (for admin access)
CREATE POLICY "Service role can read" ON waitlist
  FOR SELECT
  USING (auth.role() = 'service_role');
