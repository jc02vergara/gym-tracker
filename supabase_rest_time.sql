-- Add rest_time column to users table with a default of 180 seconds (3 minutos)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS rest_time INTEGER DEFAULT 180;
