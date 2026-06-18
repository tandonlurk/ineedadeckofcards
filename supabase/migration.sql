-- Run this in the Supabase SQL editor for your project.

create table if not exists rooms (
  code text primary key,
  host_token text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists rooms_set_updated_at on rooms;
create trigger rooms_set_updated_at
  before update on rooms
  for each row
  execute function set_updated_at();

-- Row Level Security: clients only ever read via the anon key (realtime
-- subscriptions + initial fetch). All writes go through server-side API
-- routes using the service role key, which bypasses RLS entirely.
alter table rooms enable row level security;

create policy "Anyone can read room state"
  on rooms for select
  using (true);

-- Enable Realtime for this table (Database > Replication > rooms in the
-- Supabase dashboard, or run this):
alter publication supabase_realtime add table rooms;
