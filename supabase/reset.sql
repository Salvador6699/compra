-- ==============================================================================
-- SCRIPT DE LIMPIEZA TOTAL DE LA BASE DE DATOS (RESET)
-- Deja la libreta completamente vacía, lista para uso real desde cero.
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Vaciar el historial de compras y el catálogo completo de productos
TRUNCATE TABLE public.purchase_history, public.products CASCADE;

-- 2. Confirmación (devolverá 0 filas en ambas tablas)
SELECT 'products' AS tabla, COUNT(*) AS total_filas FROM public.products
UNION ALL
SELECT 'purchase_history' AS tabla, COUNT(*) AS total_filas FROM public.purchase_history;
