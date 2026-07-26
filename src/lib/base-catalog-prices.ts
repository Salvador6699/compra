import type { Category, StoreName } from "./shopping-data";

export type BaseCatalogItem = {
  name: string;
  category: Category;
  preferredStore?: StoreName;
  prices?: Partial<Record<StoreName, number>>;
};

export const BASE_CATALOG_WITH_PRICES: BaseCatalogItem[] = [
  {
    "name": "Azúcar",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.85
    }
  },
  {
    "name": "Cacao instantáneo",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 3.75
    }
  },
  {
    "name": "Infusión",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.89
    }
  },
  {
    "name": "Macarrones",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.15
    }
  },
  {
    "name": "Espirales vegetales",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.59
    }
  },
  {
    "name": "Fideuá",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.8
    }
  },
  {
    "name": "Sal",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.35
    }
  },
  {
    "name": "Tomate frito",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.39
    }
  },
  {
    "name": "Tomate triturado",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.49
    }
  },
  {
    "name": "Arroz redondo",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.15
    }
  },
  {
    "name": "Arroz basmati",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 3
    }
  },
  {
    "name": "Base de pizza",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.5
    }
  },
  {
    "name": "Café molido mezcla",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 4.9
    }
  },
  {
    "name": "Café cappuccino",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.75,
      "Lidl": 0.95,
      "Family Cash": 1.95
    }
  },
  {
    "name": "Ñoquis",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1
    }
  },
  {
    "name": "Noodles",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.45
    }
  },
  {
    "name": "Hélices de vegetales",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.95
    }
  },
  {
    "name": "Guisantes",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.2
    }
  },
  {
    "name": "Miel",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.69
    }
  },
  {
    "name": "Garbanzos cocidos",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.75
    }
  },
  {
    "name": "Macarrones integral",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.79
    }
  },
  {
    "name": "Mayonesa",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.09
    }
  },
  {
    "name": "Salsa de quesos",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.45
    }
  },
  {
    "name": "Salsa de trufa",
    "category": "Despensa",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.45
    }
  },
  {
    "name": "Aceitunas rellenas",
    "category": "Despensa",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.99
    }
  },
  {
    "name": "Pan de aceite",
    "category": "Panadería",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.51
    }
  },
  {
    "name": "Pan cristal",
    "category": "Panadería",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.85
    }
  },
  {
    "name": "Pan integral",
    "category": "Panadería",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.25
    }
  },
  {
    "name": "Bacon",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.2
    }
  },
  {
    "name": "Hamburguesa",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.65
    }
  },
  {
    "name": "Carrillada de vacuno",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 7.32
    }
  },
  {
    "name": "Costilla de cerdo",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 4.99
    }
  },
  {
    "name": "Carne picada de cerdo",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 3.99
    }
  },
  {
    "name": "Carne picada de vacuno",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.65
    }
  },
  {
    "name": "Panceta",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 4.99
    }
  },
  {
    "name": "Fuet Espetec",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 4.89
    }
  },
  {
    "name": "Mortadela con aceitunas",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.25
    }
  },
  {
    "name": "Chistorra",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Chorizo",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 4.2
    }
  },
  {
    "name": "Chorizo picante",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 4.2
    }
  },
  {
    "name": "Espinazo de cerdo",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.3
    }
  },
  {
    "name": "Guanciale",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.99
    }
  },
  {
    "name": "Hueso de vacuno",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 4.53
    }
  },
  {
    "name": "Jamón cocido",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.25
    }
  },
  {
    "name": "Pechuga de pollo",
    "category": "Carne y embutidos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 5.99
    }
  },
  {
    "name": "Jamoncitos de pollo",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 3.3
    }
  },
  {
    "name": "Pechuga de pavo",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.85
    }
  },
  {
    "name": "Osobuco",
    "category": "Carne y embutidos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.94
    }
  },
  {
    "name": "Atún en lata",
    "category": "Pescado",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.59
    }
  },
  {
    "name": "Melva",
    "category": "Pescado",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.89
    }
  },
  {
    "name": "Salmón",
    "category": "Pescado",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 5.95
    }
  },
  {
    "name": "Calamar troceado",
    "category": "Pescado",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 5.9
    }
  },
  {
    "name": "Bebida de almendras",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 6.9
    }
  },
  {
    "name": "Batido de vainilla",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.3
    }
  },
  {
    "name": "Huevos",
    "category": "Lácteos y huevos",
    "preferredStore": "Eroski",
    "prices": {
      "Eroski": 3.49,
      "Family Cash": 4.79
    }
  },
  {
    "name": "Queso brie",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.65
    }
  },
  {
    "name": "Queso en dados",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.15
    }
  },
  {
    "name": "Queso rallado",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.6
    }
  },
  {
    "name": "Queso semicurado",
    "category": "Lácteos y huevos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2,
      "Mercadona": 2.55
    }
  },
  {
    "name": "Queso para untar finas hierbas",
    "category": "Lácteos y huevos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.75
    }
  },
  {
    "name": "Queso Grana Padano",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 3.51
    }
  },
  {
    "name": "Queso bola",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 3.9
    }
  },
  {
    "name": "Leche entera",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.56
    }
  },
  {
    "name": "Leche desnatada",
    "category": "Lácteos y huevos",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.39
    }
  },
  {
    "name": "Mantequilla",
    "category": "Lácteos y huevos",
    "prices": {
      "Family Cash": 0.75
    }
  },
  {
    "name": "Nata para cocinar",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.55
    }
  },
  {
    "name": "Yogur natural azúcar de caña",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.05
    }
  },
  {
    "name": "Kéfir",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.1
    }
  },
  {
    "name": "Queso fresco batido",
    "category": "Lácteos y huevos",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.1
    }
  },
  {
    "name": "Plátano",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.25,
      "Eroski": 1.65
    }
  },
  {
    "name": "Champiñones",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.91
    }
  },
  {
    "name": "Espinacas",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.15
    }
  },
  {
    "name": "Patatas",
    "category": "Frutas y verduras",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.29,
      "Mercadona": 4.65
    }
  },
  {
    "name": "Pera",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.45
    }
  },
  {
    "name": "Calabaza",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.85
    }
  },
  {
    "name": "Zanahoria",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.8
    }
  },
  {
    "name": "Ensalada",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.8
    }
  },
  {
    "name": "Melón Sapo",
    "category": "Frutas y verduras",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2
    }
  },
  {
    "name": "Espagueti carbonara",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.2
    }
  },
  {
    "name": "Pizza atún bacon",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Pizza frankfurt",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Pizza jamón serrano",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Pizza pepperoni",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Cocido",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.75
    }
  },
  {
    "name": "Pelota de cocido",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.02
    }
  },
  {
    "name": "Lasaña de pavo",
    "category": "Platos preparados",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.55
    }
  },
  {
    "name": "Crema de verduras",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.95
    }
  },
  {
    "name": "Ensaladilla rusa",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.8
    }
  },
  {
    "name": "Empanadillas",
    "category": "Platos preparados",
    "preferredStore": "Consum",
    "prices": {
      "Consum": 1.99
    }
  },
  {
    "name": "Pasta pollo pesto",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.4
    }
  },
  {
    "name": "Caldo casero",
    "category": "Platos preparados",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.95
    }
  },
  {
    "name": "Zumo con leche",
    "category": "Bebidas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.29
    }
  },
  {
    "name": "Agua",
    "category": "Bebidas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.7
    }
  },
  {
    "name": "Nestea maracuya",
    "category": "Bebidas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.65,
      "Mercadona": 1
    }
  },
  {
    "name": "Refresco de piña",
    "category": "Bebidas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.69
    }
  },
  {
    "name": "Bebida isotónica",
    "category": "Bebidas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.75
    }
  },
  {
    "name": "Monster",
    "category": "Bebidas",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.68,
      "Family Cash": 1.79
    }
  },
  {
    "name": "Bombón almendrado",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Tarrina de leche merengada",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.95
    }
  },
  {
    "name": "SuperSándwich nata",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.9
    }
  },
  {
    "name": "Dochi tarta de la abuela",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 3
    }
  },
  {
    "name": "Palomitas",
    "category": "Snacks y dulces",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.75
    }
  },
  {
    "name": "Patatas fritas",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 0.8,
      "Family Cash": 1.15
    }
  },
  {
    "name": "Snacks",
    "category": "Snacks y dulces",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.79,
      "Consum": 1.99
    }
  },
  {
    "name": "Pipas",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.32,
      "Family Cash": 3.99
    }
  },
  {
    "name": "Galletas",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.85
    }
  },
  {
    "name": "Mousse de chocolate",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.2
    }
  },
  {
    "name": "Natillas con galleta",
    "category": "Snacks y dulces",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.15,
      "Family Cash": 2.89
    }
  },
  {
    "name": "Arena para gatos",
    "category": "Mascotas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.45
    }
  },
  {
    "name": "Sopa gatos Felix",
    "category": "Mascotas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.99
    }
  },
  {
    "name": "Húmedo gatos Felix",
    "category": "Mascotas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 2.79
    }
  },
  {
    "name": "Pienso gatos Catisfacti",
    "category": "Mascotas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1
    }
  },
  {
    "name": "Guantes",
    "category": "Herramientas",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.65
    }
  },
  {
    "name": "Detergente lavadora",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Mercadona": 1.95
    }
  },
  {
    "name": "Papel de cocina",
    "category": "Hogar y limpieza",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.2
    }
  },
  {
    "name": "Papel higiénico",
    "category": "Hogar y limpieza",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.3
    }
  },
  {
    "name": "Bolsas de congelación zip",
    "category": "Hogar y limpieza",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.2
    }
  },
  {
    "name": "Suavizante ropa",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.39
    }
  },
  {
    "name": "Lavavajillas",
    "category": "Hogar y limpieza",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 1.3
    }
  },
  {
    "name": "Limpiacristales",
    "category": "Hogar y limpieza",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.3
    }
  },
  {
    "name": "Fregona microfibra",
    "category": "Hogar y limpieza",
    "preferredStore": "Mercadona",
    "prices": {
      "Mercadona": 2.7
    }
  },
  {
    "name": "Fregasuelos",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.85
    }
  },
  {
    "name": "Limpiador WC",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.89
    }
  },
  {
    "name": "Torcamans",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 3.95
    }
  },
  {
    "name": "Jabón de manos",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.89
    }
  },
  {
    "name": "Detergente lavadora",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 5.99
    }
  },
  {
    "name": "Vela vaso aromática",
    "category": "Hogar y limpieza",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.75
    }
  },
  {
    "name": "Mascarilla capilar",
    "category": "Cuidado personal",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 1.89
    }
  },
  {
    "name": "Desodorante roll-on",
    "category": "Cuidado personal",
    "preferredStore": "Family Cash",
    "prices": {
      "Family Cash": 0.75
    }
  },
  {
    "name": "Pimiento congelado variado",
    "category": "Platos preparados",
    "preferredStore": "Mercadona"
  }
];
