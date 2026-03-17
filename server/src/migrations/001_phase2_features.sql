-- Phase 2 Database Migrations
-- Run these in the Supabase SQL editor

-- 2.2 Resume Sharing
create table if not exists resume_shares (
  id uuid default uuid_generate_v4() primary key,
  resume_id uuid references resumes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  share_token text unique not null,
  is_active boolean default true,
  views integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_resume_shares_token on resume_shares(share_token);

alter table resume_shares enable row level security;

drop policy if exists "Anyone can view active shares" on resume_shares;
create policy "Anyone can view active shares" on resume_shares for select using (is_active = true);

drop policy if exists "Users can manage own shares" on resume_shares;
create policy "Users can manage own shares" on resume_shares for all using (auth.uid() = user_id);

-- 2.3 Link Job Tracker to Resume Tailoring
alter table applications add column if not exists job_description text default '';

-- 2.4 Student Program
alter table user_profiles add column if not exists is_student boolean default false;
alter table user_profiles add column if not exists student_verified_at timestamptz;
alter table user_profiles add column if not exists student_expires_at timestamptz;
