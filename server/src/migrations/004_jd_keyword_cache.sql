-- Cache for LLM-extracted job-description keywords.
-- Keyed by a sha256 hash of the JD so the same posting always resolves to the
-- same keyword list (reproducible scoring; survives Vercel cold starts).
-- Run in the Supabase SQL editor.

create table if not exists jd_keyword_cache (
  jd_hash text primary key,
  keywords jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Written and read only by the server (service role, which bypasses RLS).
-- Enable RLS with no policies so anon/authenticated clients cannot read it.
alter table jd_keyword_cache enable row level security;
