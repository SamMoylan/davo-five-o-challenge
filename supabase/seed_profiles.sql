-- Run this after creating and confirming the five users in Supabase Auth.

insert into public.participants (id, slug, display_name, color)
select
  users.id,
  profiles.slug,
  profiles.display_name,
  profiles.color
from auth.users as users
join (
  values
    ('sam@davo-five-o.local', 'sam', 'Sam', '#f2c94c'),
    ('trish@davo-five-o.local', 'trish', 'Trish', '#ef8354'),
    ('dave@davo-five-o.local', 'dave', 'Dave', '#3b82a0'),
    ('emma@davo-five-o.local', 'emma', 'Emma', '#8a6fd1'),
    ('jacob@davo-five-o.local', 'jacob', 'Jacob', '#54a777')
) as profiles(email, slug, display_name, color)
  on lower(users.email) = profiles.email
on conflict (id) do update
set
  slug = excluded.slug,
  display_name = excluded.display_name,
  color = excluded.color;
