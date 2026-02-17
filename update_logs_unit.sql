-- Add 'unit' column to 'logs' table
-- Default to 'kg' for existing rows to preserve data integrity
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';

-- Optional: Update existing records to ensure they have 'kg' if null (though DEFAULT handles new inserts)
UPDATE logs SET unit = 'kg' WHERE unit IS NULL;
