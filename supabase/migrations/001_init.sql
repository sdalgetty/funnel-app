create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default',
  bookings_goal int8,
  inquiry_to_call numeric,
  call_to_booking numeric,
  inquiries_ytd int8,
  calls_ytd int8,
  bookings_ytd int8,
  updated_at timestamptz not null default now()
);

alter table funnels enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.funnels to anon, authenticated;

create unique index if not exists funnels_user_name_key
on public.funnels (user_id, name);
