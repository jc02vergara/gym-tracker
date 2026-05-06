-- Ejecutar en el Editor SQL de Supabase para agregar soporte a medidas dinámicas

-- 1. Agregar columna para guardar la configuración de medidas del usuario
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS measurement_prefs JSONB DEFAULT '["Pecho", "Glúteos", "Brazos", "Piernas"]'::jsonb;

-- 2. Agregar columna en measurements para guardar datos dinámicos como un objeto JSON
ALTER TABLE measurements
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 3. (Opcional pero Recomendado) Migrar los datos antiguos al formato JSON para que sean compatibles
-- Esto moverá los valores de chest, waist, arms y legs al nuevo campo "data"
UPDATE measurements
SET data = jsonb_build_object(
    'Pecho', chest,
    'Glúteos', waist,
    'Brazos', arms,
    'Piernas', legs
)
WHERE (data = '{}'::jsonb OR data IS NULL) 
  AND (chest IS NOT NULL OR waist IS NOT NULL OR arms IS NOT NULL OR legs IS NOT NULL);
