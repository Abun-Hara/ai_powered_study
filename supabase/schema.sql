-- AI-Powered Study Planner backend schema for Supabase
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- =========================
-- Core helper functions
-- =========================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- =========================
-- Tables
-- =========================

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  name text not null default 'Student',
  username text,
  avatar_url text,
  phone text,
  bio text,
  daily_ai_token_limit integer not null default 50000 check (daily_ai_token_limit > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- SECURITY DEFINER so policies can safely check admin role without recursive RLS problems.
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and u.role = 'admin'
      and u.status = 'active'
  );
$$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  code text not null default '',
  instructor text not null default '',
  color text not null default '#2e87f2',
  deadline date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.courses
  add column if not exists code text not null default '';

alter table public.courses
  add column if not exists instructor text not null default '';

alter table public.courses
  add column if not exists deadline date;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  due_date timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  date date not null,
  tasks_completed integer not null default 0 check (tasks_completed >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  action_type text not null,
  tokens_used integer not null check (tokens_used >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  file_name text not null,
  summary_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- File metadata table for Supabase Storage uploads.
create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  bucket_id text not null default 'study-pdfs',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket_id, storage_path)
);

-- Global platform settings and announcements (single row: id=1)
create table if not exists public.platform_settings (
  id integer primary key check (id = 1),
  maintenance_mode boolean not null default false,
  announcement text not null default '',
  default_theme text not null default 'system' check (default_theme in ('light', 'dark', 'system')),
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.platform_settings (id, maintenance_mode, announcement, default_theme)
values (1, false, 'Welcome to the AI-Powered Study Planner. Stay consistent this week.', 'system')
on conflict (id) do nothing;

-- Chat threads between admins and students
create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  deleted_by_admin boolean not null default false,
  deleted_by_student boolean not null default false,
  last_read_by_admin_at timestamptz,
  last_read_by_student_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  sender_role text not null check (sender_role in ('admin', 'student')),
  sender_name text not null,
  message text not null,
  deleted_by_admin boolean not null default false,
  deleted_by_student boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.support_messages
  add column if not exists deleted_by_admin boolean not null default false;

alter table public.support_messages
  add column if not exists deleted_by_student boolean not null default false;

-- =========================
-- Indexing
-- =========================

create index if not exists idx_courses_user_id on public.courses (user_id);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_course_id on public.tasks (course_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_due_date on public.tasks (due_date);
create index if not exists idx_study_logs_user_date on public.study_logs (user_id, date desc);
create index if not exists idx_ai_usage_user_created on public.ai_usage (user_id, created_at desc);
create index if not exists idx_ai_summaries_user_created on public.ai_summaries (user_id, created_at desc);
create index if not exists idx_uploaded_files_user_created on public.uploaded_files (user_id, created_at desc);
create index if not exists idx_support_threads_student_updated on public.support_threads (student_id, updated_at desc);
create index if not exists idx_support_threads_updated on public.support_threads (updated_at desc);
create index if not exists idx_support_messages_thread_created on public.support_messages (thread_id, created_at asc);
create index if not exists idx_platform_settings_updated on public.platform_settings (updated_at desc);

-- =========================
-- Triggers
-- =========================

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.handle_updated_at();

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.handle_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.handle_updated_at();

drop trigger if exists trg_study_logs_updated_at on public.study_logs;
create trigger trg_study_logs_updated_at
before update on public.study_logs
for each row execute function public.handle_updated_at();

drop trigger if exists trg_support_threads_updated_at on public.support_threads;
create trigger trg_support_threads_updated_at
before update on public.support_threads
for each row execute function public.handle_updated_at();

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at
before update on public.platform_settings
for each row execute function public.handle_updated_at();

-- Keep task completion timestamp consistent.
create or replace function public.sync_task_completion_timestamp()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at = coalesce(new.completed_at, timezone('utc', now()));
  elsif new.status <> 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tasks_completion_timestamp on public.tasks;
create trigger trg_tasks_completion_timestamp
before update on public.tasks
for each row execute function public.sync_task_completion_timestamp();

-- =========================
-- Auth bootstrap trigger
-- =========================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, status, name)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'user') = 'admin' then 'admin'
      else 'user'
    end,
    'active',
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- =========================
-- Business logic functions
-- =========================

create or replace function public.ensure_user_is_active(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select u.status into v_status
  from public.users u
  where u.id = p_user_id;

  if v_status is null then
    raise exception 'User profile not found';
  end if;

  if v_status <> 'active' then
    raise exception 'User account is suspended';
  end if;
end;
$$;

create or replace function public.mark_task_completed(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
begin
  update public.tasks t
  set status = 'completed',
      completed_at = timezone('utc', now())
  where t.id = p_task_id
    and (t.user_id = auth.uid() or public.is_admin(auth.uid()))
  returning * into v_task;

  if v_task.id is null then
    raise exception 'Task not found or access denied';
  end if;

  insert into public.study_logs (user_id, date, tasks_completed)
  values (v_task.user_id, (v_task.completed_at at time zone 'utc')::date, 1)
  on conflict (user_id, date)
  do update set tasks_completed = public.study_logs.tasks_completed + 1;

  return v_task;
end;
$$;

create or replace function public.get_progress_percentage(p_user_id uuid default auth.uid())
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with counts as (
    select
      count(*)::numeric as total_tasks,
      count(*) filter (where status = 'completed')::numeric as completed_tasks
    from public.tasks
    where user_id = p_user_id
  )
  select
    case
      when total_tasks = 0 then 0
      else round((completed_tasks / total_tasks) * 100, 2)
    end
  from counts;
$$;

create or replace function public.get_study_streak(p_user_id uuid default auth.uid())
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  streak integer := 0;
  d date := current_date;
begin
  loop
    exit when not exists (
      select 1
      from public.study_logs sl
      where sl.user_id = p_user_id
        and sl.date = d
        and sl.tasks_completed > 0
    );

    streak := streak + 1;
    d := d - interval '1 day';
  end loop;

  return streak;
end;
$$;

create or replace function public.assert_daily_ai_limit(
  p_user_id uuid,
  p_additional_tokens integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_today_used integer;
begin
  if p_additional_tokens < 0 then
    raise exception 'tokens must be >= 0';
  end if;

  select daily_ai_token_limit into v_limit
  from public.users
  where id = p_user_id;

  if v_limit is null then
    raise exception 'User not found';
  end if;

  select coalesce(sum(tokens_used), 0)::integer into v_today_used
  from public.ai_usage
  where user_id = p_user_id
    and created_at >= date_trunc('day', timezone('utc', now()))
    and created_at < date_trunc('day', timezone('utc', now())) + interval '1 day';

  if (v_today_used + p_additional_tokens) > v_limit then
    raise exception 'Daily AI token limit exceeded';
  end if;
end;
$$;

create or replace function public.track_ai_usage(
  p_action_type text,
  p_tokens_used integer
)
returns public.ai_usage
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.ai_usage;
begin
  perform public.assert_daily_ai_limit(auth.uid(), p_tokens_used);

  insert into public.ai_usage (user_id, action_type, tokens_used)
  values (auth.uid(), p_action_type, p_tokens_used)
  returning * into v_usage;

  return v_usage;
end;
$$;

-- =========================
-- RLS
-- =========================

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.study_logs enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.platform_settings enable row level security;
alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

-- users table
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
on public.users
for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
on public.users
for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
to authenticated
with check (id = auth.uid() or public.is_admin(auth.uid()));

-- courses table
drop policy if exists "courses_select_own_or_admin" on public.courses;
create policy "courses_select_own_or_admin"
on public.courses
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "courses_insert_own_or_admin" on public.courses;
create policy "courses_insert_own_or_admin"
on public.courses
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "courses_update_own_or_admin" on public.courses;
create policy "courses_update_own_or_admin"
on public.courses
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "courses_delete_own_or_admin" on public.courses;
create policy "courses_delete_own_or_admin"
on public.courses
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- tasks table
drop policy if exists "tasks_select_own_or_admin" on public.tasks;
create policy "tasks_select_own_or_admin"
on public.tasks
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "tasks_insert_own_or_admin" on public.tasks;
create policy "tasks_insert_own_or_admin"
on public.tasks
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "tasks_update_own_or_admin" on public.tasks;
create policy "tasks_update_own_or_admin"
on public.tasks
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "tasks_delete_own_or_admin" on public.tasks;
create policy "tasks_delete_own_or_admin"
on public.tasks
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- study_logs table
drop policy if exists "study_logs_select_own_or_admin" on public.study_logs;
create policy "study_logs_select_own_or_admin"
on public.study_logs
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "study_logs_insert_own_or_admin" on public.study_logs;
create policy "study_logs_insert_own_or_admin"
on public.study_logs
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "study_logs_update_own_or_admin" on public.study_logs;
create policy "study_logs_update_own_or_admin"
on public.study_logs
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "study_logs_delete_own_or_admin" on public.study_logs;
create policy "study_logs_delete_own_or_admin"
on public.study_logs
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ai_usage table
drop policy if exists "ai_usage_select_own_or_admin" on public.ai_usage;
create policy "ai_usage_select_own_or_admin"
on public.ai_usage
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "ai_usage_insert_own_or_admin" on public.ai_usage;
create policy "ai_usage_insert_own_or_admin"
on public.ai_usage
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ai_summaries table
drop policy if exists "ai_summaries_select_own_or_admin" on public.ai_summaries;
create policy "ai_summaries_select_own_or_admin"
on public.ai_summaries
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "ai_summaries_insert_own_or_admin" on public.ai_summaries;
create policy "ai_summaries_insert_own_or_admin"
on public.ai_summaries
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "ai_summaries_delete_own_or_admin" on public.ai_summaries;
create policy "ai_summaries_delete_own_or_admin"
on public.ai_summaries
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- uploaded_files table
drop policy if exists "uploaded_files_select_own_or_admin" on public.uploaded_files;
create policy "uploaded_files_select_own_or_admin"
on public.uploaded_files
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "uploaded_files_insert_own_or_admin" on public.uploaded_files;
create policy "uploaded_files_insert_own_or_admin"
on public.uploaded_files
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "uploaded_files_delete_own_or_admin" on public.uploaded_files;
create policy "uploaded_files_delete_own_or_admin"
on public.uploaded_files
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- platform_settings table
drop policy if exists "platform_settings_select_all_authenticated" on public.platform_settings;
create policy "platform_settings_select_all_authenticated"
on public.platform_settings
for select
to authenticated
using (true);

drop policy if exists "platform_settings_insert_admin_only" on public.platform_settings;
create policy "platform_settings_insert_admin_only"
on public.platform_settings
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "platform_settings_update_admin_only" on public.platform_settings;
create policy "platform_settings_update_admin_only"
on public.platform_settings
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- support_threads table
drop policy if exists "support_threads_select_student_or_admin" on public.support_threads;
create policy "support_threads_select_student_or_admin"
on public.support_threads
for select
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "support_threads_insert_student_or_admin" on public.support_threads;
create policy "support_threads_insert_student_or_admin"
on public.support_threads
for insert
to authenticated
with check (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "support_threads_update_student_or_admin" on public.support_threads;
create policy "support_threads_update_student_or_admin"
on public.support_threads
for update
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()))
with check (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "support_threads_delete_student_or_admin" on public.support_threads;
create policy "support_threads_delete_student_or_admin"
on public.support_threads
for delete
to authenticated
using (student_id = auth.uid() or public.is_admin(auth.uid()));

-- support_messages table
drop policy if exists "support_messages_select_thread_member" on public.support_messages;
create policy "support_messages_select_thread_member"
on public.support_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.support_threads st
    where st.id = support_messages.thread_id
      and (st.student_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "support_messages_insert_thread_member" on public.support_messages;
create policy "support_messages_insert_thread_member"
on public.support_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.support_threads st
    where st.id = support_messages.thread_id
      and (st.student_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists "support_messages_update_thread_member" on public.support_messages;
create policy "support_messages_update_thread_member"
on public.support_messages
for update
to authenticated
using (
  sender_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  sender_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "support_messages_delete_own_or_admin" on public.support_messages;
create policy "support_messages_delete_own_or_admin"
on public.support_messages
for delete
to authenticated
using (
  sender_id = auth.uid()
  or public.is_admin(auth.uid())
);

-- =========================
-- Storage bucket + policies
-- =========================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-pdfs', 'study-pdfs', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "pdf_owner_read_or_admin" on storage.objects;
create policy "pdf_owner_read_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'study-pdfs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "pdf_owner_upload_or_admin" on storage.objects;
create policy "pdf_owner_upload_or_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'study-pdfs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "pdf_owner_update_or_admin" on storage.objects;
create policy "pdf_owner_update_or_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'study-pdfs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
)
with check (
  bucket_id = 'study-pdfs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);

drop policy if exists "pdf_owner_delete_or_admin" on storage.objects;
create policy "pdf_owner_delete_or_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'study-pdfs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);

-- =========================
-- Admin analytics view
-- =========================

create or replace view public.admin_system_analytics
with (security_invoker = true)
as
select
  (select count(*) from public.users) as total_users,
  (select count(*) from public.users where status = 'active') as active_users,
  (select count(*) from public.users where status = 'suspended') as suspended_users,
  (select count(*) from public.tasks) as total_tasks,
  (select count(*) from public.tasks where status = 'completed') as completed_tasks,
  (select coalesce(sum(tokens_used), 0) from public.ai_usage) as total_ai_tokens_used;
