<?php
// backend/get_prices.php
require_once 'config.php';

// Habilitar CORS para que la app móvil PWA/React pueda descargar los precios desde cualquier dominio
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Verificar si es una petición OPTIONS (Preflight de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Consultar todos los precios
$sql = "SELECT product_name, store_name, price FROM product_prices";
$result = $conn->query($sql);

$products = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $name = $row["product_name"];
        $store = $row["store_name"];
        $price = floatval($row["price"]);

        if (!isset($products[$name])) {
            $products[$name] = [
                "name" => $name,
                "prices" => []
            ];
        }
        
        $products[$name]["prices"][$store] = $price;
    }
}

$conn->close();

// La app de React espera un array de objetos (o un diccionario, nosotros lo parseamos como array en use-shopping-store)
// Vamos a devolver un array indexado:
$response = array_values($products);

echo json_encode($response);
?>
