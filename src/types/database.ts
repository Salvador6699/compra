export interface Product {
  id: string;
  name: string;
  cantidad: number;
  en_lista: boolean;
  comprado: boolean;
  ultima_compra: string | null; // ISO date string 'YYYY-MM-DD'
  ultima_cantidad_comprada: number;
  dias_por_unidad: number;
  intervalo_dias_promedio: number;
  total_compras: number;
  total_unidades_compradas: number;
  orden_recorrido?: number;
  en_lista_at?: string;
  comprado_at?: string | null;
  created_at: string;
}

export interface PurchaseHistory {
  id: string;
  product_id: string;
  cantidad: number;
  purchased_at: string;
  created_at: string;
}

export interface SuggestionProduct extends Product {
  dias_desde_compra: number;
  duracion_esperada: number;
}
