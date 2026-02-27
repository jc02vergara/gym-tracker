-- Run this in your Supabase Dashboard > SQL Editor to add the new fields for the Agenda feature

-- 1. Updates to routines table to support scheduling
ALTER TABLE routines 
ADD COLUMN IF NOT EXISTS scheduled_days jsonb DEFAULT '[]'::jsonb;

-- Explanation:
-- scheduled_days will store an array of days when the routine should be performed.
-- Examples: ["lunes", "miercoles", "viernes"] or ["martes", "jueves"]
