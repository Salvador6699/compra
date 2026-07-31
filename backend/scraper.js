import * as cheerio from 'cheerio';

const SERVER_UPDATE_URL = "http://plantr753:zGTk9J8N@www.listacompra.es.mialias.net/update_prices.php";
const SECRET_KEY = "Ganbaru@6699";

// Diccionario de mapeo: Añade aquí los IDs de los productos para cada tienda
const PRODUCTS_MAPPING = [
  {
    name: "Azúcar",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Cacao instantáneo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Infusión",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Macarrones",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Espirales vegetales",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Fideuá",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Sal",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Tomate frito",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Tomate triturado",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Arroz redondo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Arroz basmati",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Base de pizza",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Café molido mezcla",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Café cappuccino",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Ñoquis",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Noodles",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Hélices de vegetales",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Guisantes",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Miel",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Garbanzos cocidos",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Macarrones integral",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Mayonesa",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Salsa de quesos",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Salsa de trufa",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Aceitunas rellenas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pan de aceite",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pan cristal",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pan integral",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Bacon",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Hamburguesa",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Carrillada de vacuno",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Costilla de cerdo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Carne picada de cerdo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Carne picada de vacuno",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Panceta",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Fuet Espetec",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Mortadela con aceitunas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Chistorra",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Chorizo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Chorizo picante",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Espinazo de cerdo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Guanciale",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Hueso de vacuno",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Jamón cocido",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pechuga de pollo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Jamoncitos de pollo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pechuga de pavo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Osobuco",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Atún en lata",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Melva",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Salmón",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Calamar troceado",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Bebida de almendras",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Batido de vainilla",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Huevos",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso brie",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso en dados",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso rallado",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso semicurado",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso para untar finas hierbas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso Grana Padano",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso bola",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Leche entera",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Leche desnatada",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Mantequilla",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Nata para cocinar",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Yogur natural azúcar de caña",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Kéfir",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso fresco batido",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Plátano",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Champiñones",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Espinacas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Patatas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pera",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Calabaza",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Zanahoria",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Ensalada",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Melón Sapo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Espagueti carbonara",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pizza atún bacon",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pizza frankfurt",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pizza jamón serrano",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pizza pepperoni",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Cocido",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pelota de cocido",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Lasaña de pavo",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Crema de verduras",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Ensaladilla rusa",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Empanadillas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pasta pollo pesto",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Caldo casero",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Zumo con leche",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Agua",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Nestea maracuya",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Refresco de piña",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Bebida isotónica",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Monster",
    stores: {
      "Mercadona": "13814",
      "Consum": "7351781",
      "Eroski": "22596084",
    }
  },
  {
    name: "Bombón almendrado",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Tarrina de leche merengada",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "SuperSándwich nata",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Dochi tarta de la abuela",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Palomitas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Patatas fritas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Snacks",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pipas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Galletas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Mousse de chocolate",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Natillas con galleta",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Arena para gatos",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Sopa gatos Felix",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Húmedo gatos Felix",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pienso gatos Catisfacti",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Guantes",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Detergente lavadora",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Papel de cocina",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Papel higiénico",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Bolsas de congelación zip",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Suavizante ropa",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Lavavajillas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Limpiacristales",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Fregona microfibra",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Fregasuelos",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Limpiador WC",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Torcamans",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Jabón de manos",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Detergente lavadora",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Vela vaso aromática",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Mascarilla capilar",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Desodorante roll-on",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Pimiento congelado variado",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Mini empanadillas de queso",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Jamón serrano",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Toallitas de baño",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
  {
    name: "Queso en lonchas",
    stores: {
      // "Mercadona": "",
      // "Consum": "",
      // "Eroski": "",
    }
  },
];

// ==========================================
// FUNCIONES EXTRACTORAS POR SUPERMERCADO
// ==========================================

async function fetchMercadonaPrice(id) {
  try {
    const url = `https://tienda.mercadona.es/api/products/${id}`;
    const res = await fetch(url);
    const data = await res.json();
    return parseFloat(data.price_instructions.unit_price);
  } catch (error) {
    console.error(`Error en Mercadona (${id}):`, error.message);
    return null;
  }
}

async function fetchConsumPrice(id) {
  try {
    const url = `https://tienda.consum.es/api/rest/V1.0/catalog/product?q=${id}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.products && data.products.length > 0) {
      return parseFloat(data.products[0].priceData.prices[0].value.centAmount);
    }
    return null;
  } catch (error) {
    console.error(`Error en Consum (${id}):`, error.message);
    return null;
  }
}

async function fetchEroskiPrice(id) {
  try {
    const url = `https://supermercado.eroski.es/es/productdetail/${id}-/`;
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const priceText = $('.price-now').first().text().trim().replace(',', '.').replace(/[^\d.]/g, '');
    return priceText ? parseFloat(priceText) : null;
  } catch (error) {
    console.error(`Error en Eroski (${id}):`, error.message);
    return null;
  }
}

// ==========================================
// BUCLE PRINCIPAL
// ==========================================

async function runScraper() {
  console.log("Iniciando recolección de precios...");
  const results = [];

  for (const product of PRODUCTS_MAPPING) {
    console.log(`\nBuscando: ${product.name}`);
    const prices = {};

    if (product.stores["Mercadona"]) prices["Mercadona"] = await fetchMercadonaPrice(product.stores["Mercadona"]);
    if (product.stores["Consum"]) prices["Consum"] = await fetchConsumPrice(product.stores["Consum"]);
    if (product.stores["Eroski"]) prices["Eroski"] = await fetchEroskiPrice(product.stores["Eroski"]);

    // Filtrar nulls
    for (const key in prices) {
      if (prices[key] === null) delete prices[key];
    }

    if (Object.keys(prices).length > 0) {
      console.log(`✅ Precios encontrados para ${product.name}:`, prices);
      results.push({ name: product.name, prices });
    } else {
      console.log(`❌ Ningún precio encontrado para ${product.name}`);
    }
  }

  console.log("\nEnviando datos al servidor PHP...");
  const payload = {
    secret_key: SECRET_KEY,
    products: results
  };

  try {
    const serverUrl = new URL(SERVER_UPDATE_URL);
    const headers = { 'Content-Type': 'application/json' };
    
    if (serverUrl.username || serverUrl.password) {
      const encodedAuth = Buffer.from(`${serverUrl.username}:${serverUrl.password}`).toString('base64');
      headers['Authorization'] = `Basic ${encodedAuth}`;
      serverUrl.username = '';
      serverUrl.password = '';
    }

    const res = await fetch(serverUrl.toString(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const responseData = await res.json();
    console.log("Respuesta del servidor:", responseData);
  } catch (error) {
    console.error("Error al enviar al servidor:", error.message);
  }
}

runScraper();
