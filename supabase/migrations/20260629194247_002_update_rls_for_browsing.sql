/*
# Update RLS Policies for Public Job Browsing

1. Changes
- Allow anonymous users to browse jobs (SELECT on jobs)
- Allow anonymous users to view profiles
- Allow anonymous users to view reviews
- This enables browsing without login

2. Reason
- Jobs should be visible to all visitors
- Encourages sign-up but doesn't force it for browsing
*/

-- Drop existing select policies
DROP POLICY IF EXISTS "select_jobs" ON jobs;
DROP POLICY IF EXISTS "select_profiles" ON profiles;
DROP POLICY IF EXISTS "select_reviews" ON reviews;

-- Recreate with anon access
CREATE POLICY "select_jobs" ON jobs FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);