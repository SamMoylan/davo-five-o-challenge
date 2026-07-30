-- Davo Five-O Challenge
-- Run this in the Supabase SQL editor before creating the five Auth users.

create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique check (slug in ('sam', 'trish', 'dave', 'emma', 'jacob')),
  display_name text not null,
  color text not null default '#27657a',
  created_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  week_number integer not null check (week_number between 0 and 7),
  weigh_in_date date not null,
  weight_kg numeric(5, 1) not null check (weight_kg between 30 and 300),
  exercise_sessions integer not null default 0 check (exercise_sessions between 0 and 30),
  exercise_minutes integer not null default 0 check (exercise_minutes between 0 and 3000),
  energy integer not null default 3 check (energy between 1 and 5),
  note text not null default '' check (char_length(note) <= 240),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, week_number)
);

create or replace function public.handle_new_participant()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'slug' is not null then
    insert into public.participants (id, slug, display_name, color)
    values (
      new.id,
      new.raw_user_meta_data ->> 'slug',
      coalesce(
        new.raw_user_meta_data ->> 'display_name',
        initcap(new.raw_user_meta_data ->> 'slug')
      ),
      coalesce(new.raw_user_meta_data ->> 'color', '#27657a')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_participant();

alter table public.participants enable row level security;
alter table public.check_ins enable row level security;

create policy "Signed-in family can view participants"
  on public.participants for select
  to authenticated
  using (true);

create policy "Participants can update their own profile"
  on public.participants for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Signed-in family can view all check-ins"
  on public.check_ins for select
  to authenticated
  using (true);

create policy "Participants can add their own check-ins"
  on public.check_ins for insert
  to authenticated
  with check (auth.uid() = participant_id);

create policy "Participants can update their own check-ins"
  on public.check_ins for update
  to authenticated
  using (auth.uid() = participant_id)
  with check (auth.uid() = participant_id);

create index if not exists check_ins_participant_idx
  on public.check_ins (participant_id);

create index if not exists check_ins_week_idx
  on public.check_ins (week_number);
