-- RLS por usuario con Supabase Auth (login OTP por correo).
-- La sesión se vincula con public.users mediante el correo verificado del JWT.
-- Reemplaza las políticas públicas anteriores y supabase_fix_sessions_rls.sql.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Id de public.users correspondiente al correo verificado de la sesión actual
create or replace function private.app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from public.users u
  where lower(u.email) = lower(auth.jwt() ->> 'email')
  limit 1
$$;

revoke execute on function private.app_user_id() from public, anon;
grant execute on function private.app_user_id() to authenticated;

-- Eliminar políticas de acceso público
drop policy if exists "Public Access Users" on public.users;
drop policy if exists "Public Access Routines" on public.routines;
drop policy if exists "Public Access Exercises" on public.exercises;
drop policy if exists "Public Access Logs" on public.logs;
drop policy if exists "Public Access Measurements" on public.measurements;
drop policy if exists "Users can manage their own sessions" on public.workout_sessions;

alter table public.users enable row level security;
alter table public.routines enable row level security;
alter table public.exercises enable row level security;
alter table public.logs enable row level security;
alter table public.measurements enable row level security;
alter table public.workout_sessions enable row level security;

-- users: leer y editar solo el propio perfil
create policy "Own profile select" on public.users
  for select to authenticated using (id = (select private.app_user_id()));
create policy "Own profile update" on public.users
  for update to authenticated
  using (id = (select private.app_user_id()))
  with check (id = (select private.app_user_id()));

-- Tablas con user_id
create policy "Own routines" on public.routines
  for all to authenticated
  using (user_id = (select private.app_user_id()))
  with check (user_id = (select private.app_user_id()));

create policy "Own logs" on public.logs
  for all to authenticated
  using (user_id = (select private.app_user_id()))
  with check (user_id = (select private.app_user_id()));

create policy "Own measurements" on public.measurements
  for all to authenticated
  using (user_id = (select private.app_user_id()))
  with check (user_id = (select private.app_user_id()));

create policy "Own workout sessions" on public.workout_sessions
  for all to authenticated
  using (user_id = (select private.app_user_id()))
  with check (user_id = (select private.app_user_id()));

-- exercises: pertenecen al usuario a través de su rutina
create policy "Own exercises" on public.exercises
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select private.app_user_id())))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select private.app_user_id())));
