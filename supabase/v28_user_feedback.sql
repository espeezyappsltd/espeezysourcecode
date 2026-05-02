-- Create user_feedback table
create table if not exists public.user_feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  category text, -- e.g. "Bug", "Suggestion", "General"
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_feedback enable row level security;

-- Policies
create policy "Users can submit feedback" 
on public.user_feedback for insert 
with check (auth.uid() = user_id);

create policy "Admins can view feedback" 
on public.user_feedback for select 
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);
