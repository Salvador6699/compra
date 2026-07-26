// Initial seed list. Items separated by "/" are split into separate products.
// Each item has a category for grouping in the UI.

export type Category =
  | "Despensa"
  | "Panadería"
  | "Carne y embutidos"
  | "Pescado"
  | "Lácteos y huevos"
  | "Frutas y verduras"
  | "Platos preparados"
  | "Bebidas"
  | "Snacks y dulces"
  | "Mascotas"
  | "Hogar y limpieza"
  | "Cuidado personal"
  | "Otros";

export const CATEGORIES: Category[] = [
  "Despensa",
  "Panadería",
  "Carne y embutidos",
  "Pescado",
  "Lácteos y huevos",
  "Frutas y verduras",
  "Platos preparados",
  "Bebidas",
  "Snacks y dulces",
  "Mascotas",
  "Hogar y limpieza",
  "Cuidado personal",
  "Otros",
];

export type StoreName =
  | "Mercadona"
  | "Lidl"
  | "Carrefour"
  | "Consum"
  | "Dia"
  | "Alcampo"
  | "Eroski"
  | "Aldi"
  | "Otro";

export const STORES: StoreName[] = [
  "Mercadona",
  "Lidl",
  "Carrefour",
  "Consum",
  "Dia",
  "Alcampo",
  "Eroski",
  "Aldi",
  "Otro",
];

export const STORE_BADGE_STYLE: Record<StoreName, { bg: string; text: string; icon: string }> = {
  Mercadona: { bg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800", text: "text-emerald-800 dark:text-emerald-300", icon: "🟢" },
  Lidl: { bg: "bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800", text: "text-blue-800 dark:text-blue-300", icon: "🔵" },
  Carrefour: { bg: "bg-indigo-100 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800", text: "text-indigo-800 dark:text-indigo-300", icon: "🔴" },
  Consum: { bg: "bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800", text: "text-orange-800 dark:text-orange-300", icon: "🟠" },
  Dia: { bg: "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800", text: "text-red-800 dark:text-red-300", icon: "🔴" },
  Alcampo: { bg: "bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800", text: "text-rose-800 dark:text-rose-300", icon: "🐥" },
  Eroski: { bg: "bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800", text: "text-sky-800 dark:text-sky-300", icon: "🔹" },
  Aldi: { bg: "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300", icon: "🟡" },
  Otro: { bg: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700", text: "text-slate-800 dark:text-slate-300", icon: "🏪" },
};

export type SeedItem = { name: string; category: Category; preferredStore?: StoreName };

export const SEED_ITEMS: SeedItem[] = [
  // Despensa
  { name: "Azúcar", category: "Despensa" },
  { name: "Cacao instantáneo", category: "Despensa" },
  { name: "Infusión", category: "Despensa" },
  { name: "Macarrones", category: "Despensa" },
  { name: "Tallarines", category: "Despensa" },
  { name: "Espirales", category: "Despensa" },
  { name: "Espirales vegetales", category: "Despensa" },
  { name: "Fideuá", category: "Despensa" },
  { name: "Sal", category: "Despensa" },
  { name: "Tomate frito", category: "Despensa" },
  { name: "Tomate triturado", category: "Despensa" },
  { name: "Arroz redondo", category: "Despensa" },
  { name: "Arroz basmati", category: "Despensa" },
  { name: "Base de pizza", category: "Despensa" },
  { name: "Base de pizza cereales", category: "Despensa" },
  { name: "Café molido mezcla", category: "Despensa" },
  { name: "Café cappuccino", category: "Despensa" },
  { name: "Ñoquis", category: "Despensa" },
  { name: "Noodles", category: "Despensa" },
  { name: "Hélices de vegetales", category: "Despensa" },
  { name: "Guisantes", category: "Despensa" },
  { name: "Miel", category: "Despensa" },
  { name: "Garbanzos cocidos", category: "Despensa" },
  { name: "Pluma rayada integral", category: "Despensa" },
  { name: "Mayonesa", category: "Despensa" },
  { name: "Salsa de quesos", category: "Despensa" },
  { name: "Salsa de trufa", category: "Despensa" },
  { name: "Aceitunas", category: "Despensa" },
  { name: "Aceitunas rellenas", category: "Despensa" },

  // Panadería
  { name: "Pan de aceite", category: "Panadería" },
  { name: "Pan cristal", category: "Panadería" },
  { name: "Pan integral", category: "Panadería" },

  // Carne y embutidos
  { name: "Bacon", category: "Carne y embutidos" },
  { name: "Hamburguesa", category: "Carne y embutidos" },
  { name: "Carrillada de vacuno", category: "Carne y embutidos" },
  { name: "Costilla de cerdo", category: "Carne y embutidos" },
  { name: "Carne picada de cerdo", category: "Carne y embutidos" },
  { name: "Carne picada de vacuno", category: "Carne y embutidos" },
  { name: "Panceta", category: "Carne y embutidos" },
  { name: "Espetec", category: "Carne y embutidos" },
  { name: "Mortadela con aceitunas", category: "Carne y embutidos" },
  { name: "Chistorra", category: "Carne y embutidos" },
  { name: "Chorizo", category: "Carne y embutidos" },
  { name: "Chorizo picante", category: "Carne y embutidos" },
  { name: "Espinazo de cerdo", category: "Carne y embutidos" },
  { name: "Guanciale", category: "Carne y embutidos" },
  { name: "Hueso de vacuno", category: "Carne y embutidos" },
  { name: "Jamón cocido", category: "Carne y embutidos" },
  { name: "Pechuga de pollo", category: "Carne y embutidos" },
  { name: "Jamoncitos de pollo", category: "Carne y embutidos" },
  { name: "Pechuga de pavo", category: "Carne y embutidos" },
  { name: "Osobuco", category: "Carne y embutidos" },

  // Pescado
  { name: "Atún en lata", category: "Pescado" },
  { name: "Melva", category: "Pescado" },
  { name: "Salmón", category: "Pescado" },
  { name: "Calamar troceado", category: "Pescado" },

  // Lácteos y huevos
  { name: "Bebida de almendras", category: "Lácteos y huevos" },
  { name: "Batido de vainilla", category: "Lácteos y huevos" },
  { name: "Huevos", category: "Lácteos y huevos" },
  { name: "Queso brie", category: "Lácteos y huevos" },
  { name: "Queso en dados", category: "Lácteos y huevos" },
  { name: "Queso rallado", category: "Lácteos y huevos" },
  { name: "Queso semicurado", category: "Lácteos y huevos" },
  { name: "Queso para untar finas hierbas", category: "Lácteos y huevos" },
  { name: "Queso Grana Padano", category: "Lácteos y huevos" },
  { name: "Queso bola", category: "Lácteos y huevos" },
  { name: "Leche entera", category: "Lácteos y huevos" },
  { name: "Leche desnatada", category: "Lácteos y huevos" },
  { name: "Mantequilla", category: "Lácteos y huevos" },
  { name: "Nata para cocinar", category: "Lácteos y huevos" },
  { name: "Yogur natural azúcar de caña", category: "Lácteos y huevos" },
  { name: "Kéfir", category: "Lácteos y huevos" },
  { name: "Queso fresco batido", category: "Lácteos y huevos" },

  // Frutas y verduras
  { name: "Plátano", category: "Frutas y verduras" },
  { name: "Champiñones", category: "Frutas y verduras" },
  { name: "Espinacas", category: "Frutas y verduras" },
  { name: "Pimiento verde", category: "Frutas y verduras" },
  { name: "Pimiento rojo", category: "Frutas y verduras" },
  { name: "Patatas", category: "Frutas y verduras" },
  { name: "Pera", category: "Frutas y verduras" },
  { name: "Calabaza", category: "Frutas y verduras" },
  { name: "Zanahoria", category: "Frutas y verduras" },
  { name: "Ensalada", category: "Frutas y verduras" },
  { name: "Melón Sapo", category: "Frutas y verduras" },

  // Platos preparados
  { name: "Espagueti carbonara", category: "Platos preparados" },
  { name: "Pizza atún bacon", category: "Platos preparados" },
  { name: "Pizza frankfurt", category: "Platos preparados" },
  { name: "Pizza jamón serrano", category: "Platos preparados" },
  { name: "Pizza pepperoni", category: "Platos preparados" },
  { name: "Cocido", category: "Platos preparados" },
  { name: "Pelota de cocido", category: "Platos preparados" },
  { name: "Lasaña de pavo", category: "Platos preparados" },
  { name: "Crema de verduras", category: "Platos preparados" },
  { name: "Ensaladilla rusa", category: "Platos preparados" },
  { name: "Empanadillas", category: "Platos preparados" },
  { name: "Pasta pollo pesto", category: "Platos preparados" },
  { name: "Caldo casero", category: "Platos preparados" },

  // Bebidas
  { name: "Zumo con leche", category: "Bebidas" },
  { name: "Agua", category: "Bebidas" },
  { name: "Té helado", category: "Bebidas" },
  { name: "Refresco de piña", category: "Bebidas" },
  { name: "Bebida isotónica", category: "Bebidas" },
  { name: "Monster", category: "Bebidas" },

  // Snacks y dulces
  { name: "Bombón almendrado", category: "Snacks y dulces" },
  { name: "Tarrina de leche merengada", category: "Snacks y dulces" },
  { name: "SuperSándwich nata", category: "Snacks y dulces" },
  { name: "Dochi tarta de la abuela", category: "Snacks y dulces" },
  { name: "Palomitas", category: "Snacks y dulces" },
  { name: "Patatas fritas", category: "Snacks y dulces" },
  { name: "Snacks", category: "Snacks y dulces" },
  { name: "Pipas", category: "Snacks y dulces" },
  { name: "Galletas", category: "Snacks y dulces" },
  { name: "Mousse de chocolate", category: "Snacks y dulces" },
  { name: "Natillas con galleta", category: "Snacks y dulces" },

  // Mascotas
  { name: "Arena para gatos", category: "Mascotas" },
  { name: "Sopa gatos Felix", category: "Mascotas" },
  { name: "Húmedo gatos Felix", category: "Mascotas" },
  { name: "Pienso gatos Catisfacti", category: "Mascotas" },

  // Hogar y limpieza
  { name: "Guantes", category: "Hogar y limpieza" },
  { name: "Limpia lavadoras", category: "Hogar y limpieza" },
  { name: "Papel de cocina", category: "Hogar y limpieza" },
  { name: "Papel higiénico", category: "Hogar y limpieza" },
  { name: "Bolsas de congelación zip", category: "Hogar y limpieza" },
  { name: "Suavizante ropa", category: "Hogar y limpieza" },
  { name: "Lavavajillas", category: "Hogar y limpieza" },
  { name: "Limpiacristales", category: "Hogar y limpieza" },
  { name: "Fregona microfibra", category: "Hogar y limpieza" },
  { name: "Fregasuelos", category: "Hogar y limpieza" },
  { name: "Limpiador WC", category: "Hogar y limpieza" },
  { name: "Torcamans", category: "Hogar y limpieza" },
  { name: "Jabón de manos", category: "Hogar y limpieza" },
  { name: "Detergente lavadora", category: "Hogar y limpieza" },
  { name: "Vela vaso aromática", category: "Hogar y limpieza" },

  // Cuidado personal
  { name: "Mascarilla capilar", category: "Cuidado personal" },
  { name: "Desodorante roll-on", category: "Cuidado personal" },
];
