-- Contact form submissions from the main site
create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  contact text not null,
  message text not null,
  locale text not null default 'zh',
  status text not null default 'new' check (status in ('new', 'read', 'replied'))
);

-- Index for admin queries (most recent first)
create index if not exists contact_submissions_created_at_idx
  on contact_submissions (created_at desc);

-- RLS: only service role can read (anon can insert via server action)
alter table contact_submissions enable row level security;

-- Allow anyone to insert (form submissions come from server action with anon key)
create policy "allow_insert" on contact_submissions
  for insert to anon with check (true);

-- Only service role can select/update (admin use only)
create policy "service_role_all" on contact_submissions
  for all to service_role using (true) with check (true);
