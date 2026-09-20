-- ==============================================================================
-- ESQUEMA SUPABASE: LISTA DE LA COMPRA COLABORATIVA CON CANTIDADES Y FRECUENCIA INTELIGENTE
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: products (Catálogo e inventario activo con cantidades)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cantidad INTEGER DEFAULT 1 NOT NULL,
    en_lista BOOLEAN DEFAULT true NOT NULL,
    comprado BOOLEAN DEFAULT false NOT NULL,
    ultima_compra DATE,
    ultima_cantidad_comprada INTEGER DEFAULT 1 NOT NULL,
    dias_por_unidad NUMERIC DEFAULT 7.0 NOT NULL,
    intervalo_dias_promedio INTEGER DEFAULT 7 NOT NULL,
    total_compras INTEGER DEFAULT 0 NOT NULL,
    total_unidades_compradas INTEGER DEFAULT 0 NOT NULL,
    orden_recorrido NUMERIC DEFAULT 100.0 NOT NULL,
    en_lista_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    comprado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla ya existía, añadir columnas nuevas de forma segura
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ultima_cantidad_comprada INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dias_por_unidad NUMERIC DEFAULT 7.0 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS total_unidades_compradas INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS orden_recorrido NUMERIC DEFAULT 100.0 NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS en_lista_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS comprado_at TIMESTAMPTZ;

-- Evitar duplicados por nombre ignorando mayúsculas/minúsculas y espacios
CREATE UNIQUE INDEX IF NOT EXISTS products_name_lower_idx ON public.products (LOWER(TRIM(name)));

-- 3. TABLA: purchase_history (Historial de compras con cantidad)
CREATE TABLE IF NOT EXISTS public.purchase_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    cantidad INTEGER DEFAULT 1 NOT NULL,
    purchased_at DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.purchase_history ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 1 NOT NULL;
CREATE INDEX IF NOT EXISTS purchase_history_product_idx ON public.purchase_history(product_id);

-- 4. SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso publico total a products" ON public.products;
CREATE POLICY "Acceso publico total a products"
    ON public.products
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico total a purchase_history" ON public.purchase_history;
CREATE POLICY "Acceso publico total a purchase_history"
    ON public.purchase_history
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. HABILITAR SUPABASE REALTIME
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;

-- 6. FUNCIÓN RPC: finalize_purchase()
-- Tiene en cuenta tanto la FECHA como la CANTIDAD comprada:
-- Si compraste 4 panes hace 8 días -> cada pan dura 2 días.
-- Si la siguiente vez compras 6 panes -> la duración estimada será 6 x 2 = 12 días.
CREATE OR REPLACE FUNCTION public.finalize_purchase()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_purchase_date DATE;
    v_diff_days INTEGER;
    v_prev_qty INTEGER;
    v_new_dias_por_unidad NUMERIC;
    v_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT id, name, cantidad, ultima_compra, ultima_cantidad_comprada, 
               dias_por_unidad, total_compras, total_unidades_compradas, comprado_at
        FROM public.products
        WHERE comprado = true
    LOOP
        -- Fecha real en que se tachó el producto (o CURRENT_DATE como fallback)
        v_purchase_date := COALESCE(r.comprado_at::date, CURRENT_DATE);

        -- 1. Insertar registro histórico con la fecha real y cantidad real comprada
        INSERT INTO public.purchase_history (product_id, cantidad, purchased_at)
        VALUES (r.id, GREATEST(1, COALESCE(r.cantidad, 1)), v_purchase_date);

        -- 2. Calcular días por unidad según el intervalo transcurrido hasta la fecha real de compra
        v_prev_qty := GREATEST(1, COALESCE(r.ultima_cantidad_comprada, 1));

        IF r.ultima_compra IS NOT NULL AND r.total_compras >= 1 THEN
            v_diff_days := GREATEST(1, v_purchase_date - r.ultima_compra);
            
            -- Media móvil ponderada por unidades previas consumidas
            v_new_dias_por_unidad := ROUND(
                ( (COALESCE(r.dias_por_unidad, 7.0) * GREATEST(1, r.total_unidades_compradas)) + v_diff_days )::numeric / 
                (GREATEST(1, r.total_unidades_compradas) + v_prev_qty),
                2
            );
        ELSE
            -- Primera compra o sin registro previo
            v_new_dias_por_unidad := COALESCE(r.dias_por_unidad, 7.0);
        END IF;

        -- 3. Actualizar producto guardando la fecha real y cantidad para el cálculo futuro
        UPDATE public.products
        SET 
            ultima_compra = v_purchase_date,
            ultima_cantidad_comprada = GREATEST(1, COALESCE(r.cantidad, 1)),
            total_compras = r.total_compras + 1,
            total_unidades_compradas = r.total_unidades_compradas + GREATEST(1, COALESCE(r.cantidad, 1)),
            dias_por_unidad = GREATEST(0.5, v_new_dias_por_unidad),
            intervalo_dias_promedio = GREATEST(1, ROUND(v_new_dias_por_unidad * GREATEST(1, COALESCE(r.cantidad, 1)))),
            cantidad = 1, -- Reseteamos a 1 para la próxima vez que se añada
            en_lista = false,
            comprado = false,
            comprado_at = NULL
        WHERE id = r.id;

        v_count := v_count + 1;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'finalized_count', v_count,
        'date', CURRENT_DATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_purchase() TO anon, authenticated;
