-- ==============================================================================
-- DATOS DE PRUEBA REALISTAS (SEED) PARA LA LIBRETA DE LA COMPRA
-- Simula un hogar que lleva varias semanas utilizando la aplicación.
-- Ejecuta este script en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Limpiar datos previos de prueba de forma segura
TRUNCATE TABLE public.purchase_history, public.products CASCADE;

-- 2. Insertar productos del catálogo con estados realistas
-- Categorías implícitas:
-- - Pendientes en la lista activa (en_lista = true, comprado = false)
-- - Ya tachados en el carrito de hoy (en_lista = true, comprado = true)
-- - Que TOCAN REPONER hoy (en_lista = false, plazo cumplido) -> Saldrán como sugerencias
-- - Comprados recientemente (en_lista = false, plazo NO cumplido) -> En catálogo para autocompletar
INSERT INTO public.products (
    id, name, cantidad, en_lista, comprado, ultima_compra, 
    ultima_cantidad_comprada, dias_por_unidad, intervalo_dias_promedio, 
    total_compras, total_unidades_compradas
) VALUES
    -- A. PRODUCTOS PENDIENTES EN LA LISTA DE HOY
    ('a0000001-0000-0000-0000-000000000001', 'Pan de barra', 2, true, false, CURRENT_DATE - 3, 2, 1.5, 3, 6, 12),
    ('a0000001-0000-0000-0000-000000000002', 'Leche entera (brick)', 3, true, false, CURRENT_DATE - 6, 3, 2.0, 6, 4, 12),
    ('a0000001-0000-0000-0000-000000000003', 'Manzanas Fuji', 1, true, false, CURRENT_DATE - 7, 1, 7.0, 7, 3, 3),

    -- B. PRODUCTOS YA TACHADOS EN EL CARRITO (Para probar el tachado y "Finalizar compra")
    ('a0000001-0000-0000-0000-000000000004', 'Yogures naturales (pack 8)', 1, true, true, CURRENT_DATE - 8, 1, 7.0, 7, 3, 3),
    ('a0000001-0000-0000-0000-000000000005', 'Plátanos de Canarias', 2, true, true, CURRENT_DATE - 5, 2, 2.5, 5, 4, 8),

    -- C. PRODUCTOS QUE TOCAN REPONER HOY (Aparecerán automáticamente en la fila "Toca reponer")
    -- Café: compraste 2 paquetes hace 14 días y cada paquete dura 7 días (2 x 7 = 14 días). ¡Toca hoy!
    ('a0000001-0000-0000-0000-000000000006', 'Café molido natural', 1, false, false, CURRENT_DATE - 14, 2, 7.0, 14, 4, 8),

    -- Huevos: compraste 1 docena hace 8 días y dura 7 días. ¡Lleva 1 día de retraso!
    ('a0000001-0000-0000-0000-000000000007', 'Huevos camperos (docena)', 1, false, false, CURRENT_DATE - 8, 1, 7.0, 7, 5, 5),

    -- Aceite de oliva: compraste 2 botellas hace 30 días y duran 15 días cada una (30 días). ¡Toca hoy!
    ('a0000001-0000-0000-0000-000000000008', 'Aceite de oliva virgen extra', 1, false, false, CURRENT_DATE - 30, 2, 15.0, 30, 2, 4),

    -- Detergente lavadora: compraste hace 21 días (su media son 20 días). ¡Toca hoy!
    ('a0000001-0000-0000-0000-000000000009', 'Detergente líquido lavadora', 1, false, false, CURRENT_DATE - 21, 1, 20.0, 20, 3, 3),

    -- D. PRODUCTOS COMPRADOS HACE POCO (Para autocompletado en el buscador, pero NO sugeridos aún)
    -- Papel higiénico: comprado hace 3 días, dura 14 días. Faltan 11 días.
    ('a0000001-0000-0000-0000-000000000010', 'Papel higiénico (pack 12)', 1, false, false, CURRENT_DATE - 3, 1, 14.0, 14, 4, 4),

    -- Arroz: comprado hace 5 días, dura 20 días. Faltan 15 días.
    ('a0000001-0000-0000-0000-000000000011', 'Arroz redondo (1kg)', 1, false, false, CURRENT_DATE - 5, 1, 20.0, 20, 2, 2),

    -- Galletas: compradas hace 2 días, duran 10 días. Faltan 8 días.
    ('a0000001-0000-0000-0000-000000000012', 'Galletas de avena', 1, false, false, CURRENT_DATE - 2, 2, 5.0, 10, 3, 6);

-- 3. Insertar historial de compras simuladas de las semanas previas
INSERT INTO public.purchase_history (product_id, cantidad, purchased_at) VALUES
    -- Pan (comprado cada 3-4 días con varias cantidades)
    ('a0000001-0000-0000-0000-000000000001', 2, CURRENT_DATE - 15),
    ('a0000001-0000-0000-0000-000000000001', 2, CURRENT_DATE - 12),
    ('a0000001-0000-0000-0000-000000000001', 2, CURRENT_DATE - 9),
    ('a0000001-0000-0000-0000-000000000001', 2, CURRENT_DATE - 6),
    ('a0000001-0000-0000-0000-000000000001', 2, CURRENT_DATE - 3),

    -- Leche entera (comprada semanalmente en packs de 3)
    ('a0000001-0000-0000-0000-000000000002', 3, CURRENT_DATE - 20),
    ('a0000001-0000-0000-0000-000000000002', 3, CURRENT_DATE - 13),
    ('a0000001-0000-0000-0000-000000000002', 3, CURRENT_DATE - 6),

    -- Café molido (comprado cada 2 semanas en packs de 2)
    ('a0000001-0000-0000-0000-000000000006', 2, CURRENT_DATE - 42),
    ('a0000001-0000-0000-0000-000000000006', 2, CURRENT_DATE - 28),
    ('a0000001-0000-0000-0000-000000000006', 2, CURRENT_DATE - 14),

    -- Huevos camperos (comprados semanalmente)
    ('a0000001-0000-0000-0000-000000000007', 1, CURRENT_DATE - 22),
    ('a0000001-0000-0000-0000-000000000007', 1, CURRENT_DATE - 15),
    ('a0000001-0000-0000-0000-000000000007', 1, CURRENT_DATE - 8),

    -- Aceite de oliva
    ('a0000001-0000-0000-0000-000000000008', 2, CURRENT_DATE - 60),
    ('a0000001-0000-0000-0000-000000000008', 2, CURRENT_DATE - 30);
