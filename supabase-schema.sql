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

-- Job Applications (tracker/kanban)
create table if not exists applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_id uuid references resumes(id) on delete set null,
  company text not null default '',
  position text not null default '',
  url text default '',
  status text default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  notes text default '',
  applied_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_applications_user_id on applications(user_id);

alter table applications enable row level security;

create policy "Users can view own applications"
  on applications for select using (auth.uid() = user_id);

create policy "Users can create own applications"
  on applications for insert with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on applications for update using (auth.uid() = user_id);

create policy "Users can delete own applications"
  on applications for delete using (auth.uid() = user_id);

create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- Resume Analytics (ATS score history)
create table if not exists resume_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_id uuid references resumes(id) on delete cascade not null,
  job_title text default '',
  score integer not null check (score >= 0 and score <= 100),
  missing_keywords jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_resume_scores_user_id on resume_scores(user_id);
create index if not exists idx_resume_scores_resume_id on resume_scores(resume_id);

alter table resume_scores enable row level security;

create policy "Users can view own scores"
  on resume_scores for select using (auth.uid() = user_id);
create policy "Users can create own scores"
  on resume_scores for insert with check (auth.uid() = user_id);
