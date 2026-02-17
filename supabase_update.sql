-- Run this in your Supabase Dashboard > SQL Editor

ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS sets integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS completed_sets integer DEFAULT 0;

-- Optional: Update existing records to have default values (already handled by DEFAULT, but good for clarity)
-- UPDATE logs SET sets = 4 WHERE sets IS NULL;
-- UPDATE logs SET completed_sets = 0 WHERE completed_sets IS NULL;
