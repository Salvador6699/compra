import { BASE_CATALOG_WITH_PRICES } from "./base-catalog-prices";

export type Category =
  | "Bebidas"
  | "Carne y embutidos"
  | "Cuidado personal"
  | "Despensa"
  | "Frutas y verduras"
  | "Herramientas"
  | "Hogar y limpieza"
  | "Lácteos y huevos"
  | "Mascotas"
  | "Panadería"
  | "Pescado"
  | "Platos preparados"
  | "Snacks y dulces";

export const CATEGORIES: Category[] = [
  "Bebidas",
  "Carne y embutidos",
  "Cuidado personal",
  "Despensa",
  "Frutas y verduras",
  "Herramientas",
  "Hogar y limpieza",
  "Lácteos y huevos",
  "Mascotas",
  "Panadería",
  "Pescado",
  "Platos preparados",
  "Snacks y dulces",
];

export const CATEGORY_ICONS: Record<Category, string> = {
  Bebidas: "🧃",
  "Carne y embutidos": "🥩",
  "Cuidado personal": "🧼",
  Despensa: "🥫",
  "Frutas y verduras": "🥦",
  Herramientas: "🛠️",
  "Hogar y limpieza": "🧹",
  "Lácteos y huevos": "🥚",
  Mascotas: "🐾",
  Panadería: "🥖",
  Pescado: "🐟",
  "Platos preparados": "🍱",
  "Snacks y dulces": "🍿",
};

export type StoreName =
  | "Mercadona"
  | "Lidl"
  | "Carrefour"
  | "Consum"
  | "Family Cash"
  | "Eroski";

export const STORES: StoreName[] = [
  "Mercadona",
  "Lidl",
  "Carrefour",
  "Consum",
  "Family Cash",
  "Eroski",
];

export const STORE_BADGE_STYLE: Record<StoreName, { bg: string; text: string; icon: string }> = {
  Mercadona: { bg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800", text: "text-emerald-800 dark:text-emerald-300", icon: "🟢" },
  Lidl: { bg: "bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800", text: "text-blue-800 dark:text-blue-300", icon: "🔵" },
  Carrefour: { bg: "bg-indigo-100 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800", text: "text-indigo-800 dark:text-indigo-300", icon: "🔴" },
  Consum: { bg: "bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800", text: "text-orange-800 dark:text-orange-300", icon: "🟠" },
  "Family Cash": { bg: "bg-teal-100 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800", text: "text-teal-800 dark:text-teal-300", icon: "🟢" },
  Eroski: { bg: "bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800", text: "text-sky-800 dark:text-sky-300", icon: "🔹" },
};

export type SeedItem = {
  name: string;
  category: Category;
  preferredStore?: StoreName;
  prices?: Partial<Record<StoreName, number>>;
};

export const SEED_ITEMS: SeedItem[] = BASE_CATALOG_WITH_PRICES;
