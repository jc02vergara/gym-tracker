-- Fix RLS policy for workout_sessions
-- The app uses custom auth (not Supabase Auth), so auth.uid() is always null.
-- Disable RLS and rely on app-level filtering by user_id instead.

ALTER TABLE workout_sessions DISABLE ROW LEVEL SECURITY;

-- Drop the old broken policy if it exists
DROP POLICY IF EXISTS "Users can manage their own sessions" ON workout_sessions;
