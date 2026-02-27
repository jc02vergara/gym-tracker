-- Run this in your Supabase Dashboard > SQL Editor to add the new fields for the PDF Report feature

-- 1. Updates to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS height decimal(5,2),
ADD COLUMN IF NOT EXISTS weight decimal(5,2),
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS goal varchar(255),
ADD COLUMN IF NOT EXISTS observations text;
