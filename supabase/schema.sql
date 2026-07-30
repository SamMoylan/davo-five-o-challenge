-- Davo Five-O Challenge
-- Run in Supabase SQL editor. Weight rows are private at database-policy level.

create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique check (slug in ('sam', 'trish', 'dave', 'emma', 'jacob')),
  display_name text not null,
  color text not null default '#27657a',
  created_at timestamptz not null default now()
);

create table if not exists public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  session_date date not null check (session_date between '2026-08-02' and '2026-09-20'),
  activity_type text not null check (activity_type in ('Gym','Walk','Run','Cycle','Swim','Sport','Other')),
  minutes integer not null check (minutes between 30 and 600),
  note text not null default '' check (char_length(note) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.private_weights (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  recorded_date date not null check (recorded_date between '2026-08-02' and '2026-09-20'),
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 300),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_participant()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'slug' is not null then
    insert into public.participants (id, slug, display_name, color)
    values (new.id, new.raw_user_meta_data ->> 'slug',
      coalesce(new.raw_user_meta_data ->> 'display_name', initcap(new.raw_user_meta_data ->> 'slug')),
      coalesce(new.raw_user_meta_data ->> 'color', '#27657a'))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_participant();

alter table public.participants enable row level security;
alter table public.activity_sessions enable row level security;
alter table public.private_weights enable row level security;

create policy "Family can view participants" on public.participants for select to authenticated using (true);
create policy "Family can view sessions" on public.activity_sessions for select to authenticated using (true);
create policy "Users add own sessions" on public.activity_sessions for insert to authenticated with check (auth.uid() = participant_id);
create policy "Users edit own sessions" on public.activity_sessions for update to authenticated using (auth.uid() = participant_id) with check (auth.uid() = participant_id);
create policy "Users delete own sessions" on public.activity_sessions for delete to authenticated using (auth.uid() = participant_id);
create policy "Weights are owner-only" on public.private_weights for select to authenticated using (auth.uid() = participant_id);
create policy "Users add own weights" on public.private_weights for insert to authenticated with check (auth.uid() = participant_id);
create policy "Users edit own weights" on public.private_weights for update to authenticated using (auth.uid() = participant_id) with check (auth.uid() = participant_id);
create policy "Users delete own weights" on public.private_weights for delete to authenticated using (auth.uid() = participant_id);

-- This view intentionally exposes only Sunday results whose 10 PM NZ reveal
-- time has passed. It never
-- returns the current in-progress week or any individual in-week measurement.
create or replace view public.released_weekly_results
with (security_invoker = false)
as
with weeks as (
  select n as week_number, ('2026-08-02'::date + n * 7) as week_end
  from generate_series(0, 7) n
),
snapshots as (
  select p.id as participant_id, w.week_number, w.week_end,
    (select pw.weight_kg from public.private_weights pw
      where pw.participant_id = p.id and pw.recorded_date <= w.week_end
      order by pw.recorded_date desc, pw.created_at desc limit 1) as weight_kg
  from public.participants p cross join weeks w
  where (w.week_end::timestamp + interval '22 hours')
    <= (now() at time zone 'Pacific/Auckland')
)
select participant_id, week_number, week_end, weight_kg,
  round((lag(weight_kg) over (partition by participant_id order by week_number) - weight_kg)::numeric, 1) as weekly_change_kg,
  round((first_value(weight_kg) over (partition by participant_id order by week_number) - weight_kg)::numeric, 1) as total_lost_kg
from snapshots
where weight_kg is not null;

grant select on public.released_weekly_results to authenticated;
create index if not exists activity_sessions_date_idx on public.activity_sessions (session_date desc);
create index if not exists private_weights_owner_date_idx on public.private_weights (participant_id, recorded_date desc);
