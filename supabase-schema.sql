-- CV Optimizer - Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Resumes table
create table if not exists resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default '',
  personal_info jsonb default '{
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "job_title": "",
    "location": "",
    "linkedin": "",
    "website": ""
  }'::jsonb,
  summary text default '',
  work_experience jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  skills jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  languages jsonb default '[]'::jsonb,
  template text default 'modern',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast user queries
create index if not exists idx_resumes_user_id on resumes(user_id);
create index if not exists idx_resumes_updated_at on resumes(updated_at desc);

-- Row Level Security: users can only access their own resumes
alter table resumes enable row level security;

create policy "Users can view own resumes"
  on resumes for select
  using (auth.uid() = user_id);

create policy "Users can create own resumes"
  on resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resumes"
  on resumes for update
  using (auth.uid() = user_id);

create policy "Users can delete own resumes"
  on resumes for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger resumes_updated_at
  before update on resumes
  for each row
  execute function update_updated_at();

-- User profiles (credits, plan)
create table if not exists user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  plan text default 'free' check (plan in ('free', 'pro', 'premium')),
  ai_credits integer default 5,
  credits_reset_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Auto-create profile on signup via trigger
create or replace function create_user_profile()
returns trigger as $$
begin
  insert into user_profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_user_profile();

-- RLS for user_profiles
alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Service role can manage all profiles (for server-side credit deduction)
-- No policy needed — service role bypasses RLS
