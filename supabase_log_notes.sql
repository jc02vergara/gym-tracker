-- Ejecutar en el Editor SQL de Supabase para agregar soporte a comentarios/observaciones en los registros

-- 1. Agregar columna para notas u observaciones opcionales en cada registro de ejercicio
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
