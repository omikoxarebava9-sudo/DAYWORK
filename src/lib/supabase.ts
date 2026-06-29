import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  skills: string[];
  is_worker: boolean;
  is_verified: boolean;
  rating: number;
  completed_jobs: number;
  created_at: string;
};

export type Job = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  budget: number;
  job_date: string;
  job_time: string | null;
  estimated_duration: string | null;
  photos: string[];
  contact_instructions: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  created_at: string;
  profiles?: Profile;
};

export type Message = {
  id: string;
  job_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'status_update';
  is_read: boolean;
  created_at: string;
  sender?: Profile;
};

export type Review = {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
  reviewee?: Profile;
};
