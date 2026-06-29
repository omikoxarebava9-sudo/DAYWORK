/*
# Initialize Job Marketplace Schema

1. New Tables
- `profiles` - User profiles (both workers and customers)
  - id (uuid, primary key, references auth.users)
  - email (text)
  - full_name (text)
  - avatar_url (text)
  - phone (text)
  - bio (text)
  - skills (text array)
  - is_worker (boolean) - can accept jobs
  - is_verified (boolean)
  - rating (decimal, default 0)
  - completed_jobs (integer, default 0)
  - created_at (timestamp)

- `jobs` - Job postings
  - id (uuid, primary key)
  - user_id (uuid, owner, references profiles)
  - title (text)
  - description (text)
  - category (text)
  - location (text)
  - latitude (decimal)
  - longitude (decimal)
  - budget (decimal)
  - job_date (date)
  - job_time (time)
  - estimated_duration (text)
  - photos (text array)
  - contact_instructions (text)
  - status (text: open/in_progress/completed/cancelled)
  - assigned_to (uuid, references profiles)
  - created_at (timestamp)

- `messages` - Chat messages
  - id (uuid, primary key)
  - job_id (uuid, references jobs)
  - sender_id (uuid, references profiles)
  - receiver_id (uuid, references profiles)
  - content (text)
  - type (text: text/image/location/status_update)
  - is_read (boolean)
  - created_at (timestamp)

- `reviews` - Job reviews
  - id (uuid, primary key)
  - job_id (uuid, references jobs)
  - reviewer_id (uuid, references profiles)
  - reviewee_id (uuid, references profiles)
  - rating (integer, 1-5)
  - comment (text)
  - created_at (timestamp)

2. Security
- Enable RLS on all tables
- Owner-scoped CRUD for profiles, jobs, messages
- Reviews can be created by involved parties

3. Indexes
- jobs: category, status, created_at
- messages: job_id, created_at
- reviews: reviewee_id
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  skills text[] DEFAULT '{}',
  is_worker boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  rating decimal DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  location text,
  latitude decimal,
  longitude decimal,
  budget decimal NOT NULL,
  job_date date NOT NULL,
  job_time time,
  estimated_duration text,
  photos text[] DEFAULT '{}',
  contact_instructions text,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_jobs" ON jobs;
CREATE POLICY "select_jobs" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_jobs" ON jobs;
CREATE POLICY "insert_own_jobs" ON jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_jobs" ON jobs;
CREATE POLICY "update_own_jobs" ON jobs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = assigned_to) WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "delete_own_jobs" ON jobs;
CREATE POLICY "delete_own_jobs" ON jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reviews" ON reviews;
CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);