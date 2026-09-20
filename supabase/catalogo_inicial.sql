-- ==============================================================================
-- CARGA DE CATÁLOGO INICIAL Y FRECUENCIAS PERSONALIZADAS
-- 144 productos con frecuencia base aprendida:
-- - Grupo 1: Frecuencia semanal (7 días - todos los sábados)
-- - Grupo 2: Frecuencia quincenal (14 días - cada dos sábados)
--
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Asegurar extensión UUID y columnas necesarias en products
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ultima_cantidad_comprada INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dias_por_unidad NUMERIC DEFAULT 7.0 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS total_unidades_compradas INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS orden_recorrido NUMERIC DEFAULT 100.0 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS en_lista_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS comprado_at TIMESTAMPTZ;

-- 2. Tabla temporal para inserción masiva limpia y segura
CREATE TEMP TABLE temp_catalogo (
    name TEXT,
    intervalo INTEGER,
    dias_unidad NUMERIC,
    dias_retraso INTEGER
);

-- ==============================================================================
-- A. PRODUCTOS SEMANALES (Cada 7 días / Todos los sábados) - 48 productos
-- ==============================================================================
-- Comprados hace 7 días -> TOCA COMPRARLOS HOY (Sugeridos)
INSERT INTO temp_catalogo (name, intervalo, dias_unidad, dias_retraso) VALUES
    ('Azúcar', 7, 7.0, 7),
    ('Tomate frito', 7, 7.0, 7),
    ('Base de pizza', 7, 7.0, 7),
    ('Café cappuccino', 7, 7.0, 7),
    ('Noodles', 7, 7.0, 7),
    ('Pan de aceite', 7, 7.0, 7),
    ('Bacon', 7, 7.0, 7),
    ('Carne picada de cerdo', 7, 7.0, 7),
    ('Fuet Espetec', 7, 7.0, 7),
    ('Guanciale', 7, 7.0, 7),
    ('Jamón cocido', 7, 7.0, 7),
    ('Atún en lata', 7, 7.0, 7),
    ('Melva', 7, 7.0, 7),
    ('Bebida de almendras', 7, 7.0, 7),
    ('Huevos', 7, 7.0, 7),
    ('Queso en dados', 7, 7.0, 7),
    ('Queso rallado', 7, 7.0, 7),
    ('Queso semicurado', 7, 7.0, 7),
    ('Queso para untar finas hierbas', 7, 7.0, 7),
    ('Leche entera', 7, 7.0, 7),
    ('Yogur natural azúcar de caña', 7, 7.0, 7),
    ('Plátano', 7, 7.0, 7),
    ('Champiñones', 7, 7.0, 7),
    ('Espinacas', 7, 7.0, 7),
    ('Zanahoria', 7, 7.0, 7),
    ('Espagueti carbonara', 7, 7.0, 7),
    ('Lasaña de pavo', 7, 7.0, 7),
    ('Zumo con leche', 7, 7.0, 7),
    ('Agua', 7, 7.0, 7),
    ('Nestea melocotón', 7, 7.0, 7),
    ('Bebida isotónica', 7, 7.0, 7),
    ('Monster', 7, 7.0, 7),
    ('Patatas fritas', 7, 7.0, 7),
    ('Snacks', 7, 7.0, 7),
    ('Natillas con galleta', 7, 7.0, 7),
    ('Arena para gatos', 7, 7.0, 7),
    ('Sopa gatos Felix', 7, 7.0, 7),
    ('Húmedo gatos Felix', 7, 7.0, 7),
    ('Pienso gatos Catisfacti', 7, 7.0, 7),
    ('Detergente lavadora', 7, 7.0, 7),
    ('Suavizante ropa', 7, 7.0, 7),
    ('Fregasuelos', 7, 7.0, 7),
    ('Limpiador WC', 7, 7.0, 7),
    ('Vela vaso aromática', 7, 7.0, 7),
    ('Pimiento congelado variado', 7, 7.0, 7),
    ('Jamón serrano', 7, 7.0, 7),
    ('Fanta Naranja', 7, 7.0, 7),
    ('Xuxes Felix', 7, 7.0, 7);

-- ==============================================================================
-- B. PRODUCTOS QUINCENALES (Cada 14 días / Cada dos sábados) - 96 productos
-- Comprados hace 7 días -> FALTAN 7 DÍAS (NO se sugieren hoy, se sugerirán la semana que viene)
-- ==============================================================================
INSERT INTO temp_catalogo (name, intervalo, dias_unidad, dias_retraso) VALUES
    ('Cacao instantáneo', 14, 14.0, 7),
    ('Infusión', 14, 14.0, 7),
    ('Macarrones', 14, 14.0, 7),
    ('Espirales vegetales', 14, 14.0, 7),
    ('Fideuá', 14, 14.0, 7),
    ('Sal', 14, 14.0, 7),
    ('Tomate triturado', 14, 14.0, 7),
    ('Arroz redondo', 14, 14.0, 7),
    ('Arroz basmati', 14, 14.0, 7),
    ('Café molido mezcla', 14, 14.0, 7),
    ('Ñoquis', 14, 14.0, 7),
    ('Guisantes', 14, 14.0, 7),
    ('Miel', 14, 14.0, 7),
    ('Garbanzos cocidos', 14, 14.0, 7),
    ('Macarrones integral', 14, 14.0, 7),
    ('Mayonesa', 14, 14.0, 7),
    ('Salsa de quesos', 14, 14.0, 7),
    ('Salsa de trufa', 14, 14.0, 7),
    ('Aceitunas rellenas', 14, 14.0, 7),
    ('Pan cristal', 14, 14.0, 7),
    ('Pan integral', 14, 14.0, 7),
    ('Hamburguesa', 14, 14.0, 7),
    ('Carrillada de vacuno', 14, 14.0, 7),
    ('Costilla de cerdo', 14, 14.0, 7),
    ('Carne picada de vacuno', 14, 14.0, 7),
    ('Panceta', 14, 14.0, 7),
    ('Mortadela con aceitunas', 14, 14.0, 7),
    ('Chistorra', 14, 14.0, 7),
    ('Chorizo', 14, 14.0, 7),
    ('Chorizo picante', 14, 14.0, 7),
    ('Espinazo de cerdo', 14, 14.0, 7),
    ('Hueso de vacuno', 14, 14.0, 7),
    ('Pechuga de pollo', 14, 14.0, 7),
    ('Jamoncitos de pollo', 14, 14.0, 7),
    ('Pechuga de pavo', 14, 14.0, 7),
    ('Osobuco', 14, 14.0, 7),
    ('Salmón', 14, 14.0, 7),
    ('Calamar troceado', 14, 14.0, 7),
    ('Batido de vainilla', 14, 14.0, 7),
    ('Queso brie', 14, 14.0, 7),
    ('Queso Grana Padano', 14, 14.0, 7),
    ('Queso bola', 14, 14.0, 7),
    ('Leche desnatada', 14, 14.0, 7),
    ('Nata para cocinar', 14, 14.0, 7),
    ('Kéfir', 14, 14.0, 7),
    ('Queso fresco batido', 14, 14.0, 7),
    ('Patatas', 14, 14.0, 7),
    ('Pera', 14, 14.0, 7),
    ('Calabaza', 14, 14.0, 7),
    ('Ensalada', 14, 14.0, 7),
    ('Melón Sapo', 14, 14.0, 7),
    ('Pizza atún bacon', 14, 14.0, 7),
    ('Pizza frankfurt', 14, 14.0, 7),
    ('Pizza jamón serrano', 14, 14.0, 7),
    ('Pizza pepperoni', 14, 14.0, 7),
    ('Cocido', 14, 14.0, 7),
    ('Pelota de cocido', 14, 14.0, 7),
    ('Crema de verduras', 14, 14.0, 7),
    ('Ensaladilla rusa', 14, 14.0, 7),
    ('Empanadillas', 14, 14.0, 7),
    ('Pasta pollo pesto', 14, 14.0, 7),
    ('Caldo casero', 14, 14.0, 7),
    ('Refresco de piña', 14, 14.0, 7),
    ('Bombón almendrado', 14, 14.0, 7),
    ('Tarrina de leche merengada', 14, 14.0, 7),
    ('SuperSándwich nata', 14, 14.0, 7),
    ('Dochi tarta de la abuela', 14, 14.0, 7),
    ('Palomitas', 14, 14.0, 7),
    ('Pipas', 14, 14.0, 7),
    ('Galletas', 14, 14.0, 7),
    ('Mousse de chocolate', 14, 14.0, 7),
    ('Guantes', 14, 14.0, 7),
    ('Papel de cocina', 14, 14.0, 7),
    ('Papel higiénico', 14, 14.0, 7),
    ('Bolsas de congelación zip', 14, 14.0, 7),
    ('Lavavajillas', 14, 14.0, 7),
    ('Limpiacristales', 14, 14.0, 7),
    ('Fregona microfibra', 14, 14.0, 7),
    ('Torcamans', 14, 14.0, 7),
    ('Jabón de manos', 14, 14.0, 7),
    ('Mascarilla capilar', 14, 14.0, 7),
    ('Desodorante roll-on', 14, 14.0, 7),
    ('Mini empanadillas de queso', 14, 14.0, 7),
    ('Toallitas de baño', 14, 14.0, 7),
    ('Queso en lonchas', 14, 14.0, 7),
    ('Arroz curry', 14, 14.0, 7),
    ('Estropajos', 14, 14.0, 7),
    ('Bolsas grandes basura', 14, 14.0, 7),
    ('Toallas grandes baño', 14, 14.0, 7),
    ('Aceite oliva', 14, 14.0, 7),
    ('Limpia lavadora', 14, 14.0, 7),
    ('Pan de hamburguesa', 14, 14.0, 7),
    ('Lejia', 14, 14.0, 7),
    ('Perejil picado', 14, 14.0, 7),
    ('Enjuague', 14, 14.0, 7),
    ('Mantequilla', 14, 14.0, 7);

-- ==============================================================================
-- 3. INSERTAR EN LA TABLA PRODUCTS
-- Si el producto ya existía por nombre, actualiza su configuración de frecuencia
-- ==============================================================================
-- Fecha de compra: ayer sábado (CURRENT_DATE - 1)
-- - Semanales (7 días): se sugerirán el próximo sábado
-- - Quincenales (14 días): se sugerirán el siguiente sábado (dentro de 2 semanas)
-- - Hoy domingo: 0 sugerencias (lista y sugerencias limpias para empezar la semana)
INSERT INTO public.products (
    name,
    cantidad,
    en_lista,
    comprado,
    ultima_compra,
    ultima_cantidad_comprada,
    dias_por_unidad,
    intervalo_dias_promedio,
    total_compras,
    total_unidades_compradas,
    orden_recorrido,
    en_lista_at,
    created_at
)
SELECT 
    t.name,
    1 AS cantidad,
    false AS en_lista,
    false AS comprado,
    CURRENT_DATE - 1 AS ultima_compra,
    1 AS ultima_cantidad_comprada,
    t.dias_unidad AS dias_por_unidad,
    t.intervalo AS intervalo_dias_promedio,
    2 AS total_compras,
    2 AS total_unidades_compradas,
    100.0 AS orden_recorrido,
    timezone('utc'::text, now()) AS en_lista_at,
    timezone('utc'::text, now()) AS created_at
FROM temp_catalogo t
ON CONFLICT (LOWER(TRIM(name))) DO UPDATE SET
    intervalo_dias_promedio = EXCLUDED.intervalo_dias_promedio,
    dias_por_unidad = EXCLUDED.dias_por_unidad,
    ultima_compra = EXCLUDED.ultima_compra,
    ultima_cantidad_comprada = 1,
    total_compras = GREATEST(public.products.total_compras, 2),
    total_unidades_compradas = GREATEST(public.products.total_unidades_compradas, 2);

-- ==============================================================================
-- 4. INSERTAR HISTORIAL SIMULADO PARA AMBOS GRUPOS
-- Para que el algoritmo tenga el historial de 2 compras registrado:
-- - Compra 1: Hace 2 ciclos (hace 14 días para semanales, 28 días para quincenales)
-- - Compra 2: Hace 1 ciclo (hace 7 días para semanales, 14 días para quincenales)
-- ==============================================================================
INSERT INTO public.purchase_history (product_id, cantidad, purchased_at)
SELECT p.id, 1, CURRENT_DATE - (t.dias_retraso * 2)
FROM temp_catalogo t
JOIN public.products p ON LOWER(TRIM(p.name)) = LOWER(TRIM(t.name))
ON CONFLICT DO NOTHING;

INSERT INTO public.purchase_history (product_id, cantidad, purchased_at)
SELECT p.id, 1, CURRENT_DATE - t.dias_retraso
FROM temp_catalogo t
JOIN public.products p ON LOWER(TRIM(p.name)) = LOWER(TRIM(t.name))
ON CONFLICT DO NOTHING;

-- Limpiar tabla temporal
DROP TABLE temp_catalogo;

-- 5. COMPROBACIÓN FINAL
SELECT 
    COUNT(*) AS total_productos_cargados,
    COUNT(*) FILTER (WHERE intervalo_dias_promedio = 7) AS semanales_7_dias,
    COUNT(*) FILTER (WHERE intervalo_dias_promedio = 14) AS quincenales_14_dias
FROM public.products;
