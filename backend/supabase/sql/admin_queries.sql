-- Admin feature examples

-- IMPORTANT:
-- Passwords are managed by Supabase Auth, not public.users.
-- Create/sign-up this account in Auth first:
--   email: abunuwudu@gmail.com
--   password: 123456

-- Promote this specific user to admin
update public.users
set role = 'admin',
    status = 'active'
where email = 'abunuwudu@gmail.com';

-- If missing in public.users, backfill from auth.users and set admin
insert into public.users (id, email, role, status, name)
select id, email, 'admin', 'active', split_part(email, '@', 1)
from auth.users
where email = 'abunuwudu@gmail.com'
on conflict (id) do update
set role = excluded.role,
    status = excluded.status;

-- Verify
select id, email, role, status, created_at
from public.users
where email = 'abunuwudu@gmail.com';

-- Fetch all users
select id, email, role, status, created_at
from public.users
order by created_at desc;

-- Suspend user
update public.users
set status = 'suspended'
where id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Activate user
update public.users
set status = 'active'
where id = '00000000-0000-0000-0000-000000000000'::uuid;

-- System analytics
select *
from public.admin_system_analytics;
