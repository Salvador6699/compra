<?php
// backend/update_prices.php
require_once 'config.php';

// Habilitar CORS para poder llamarlo desde el Recolector (extensión o script)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Verificar si es una petición OPTIONS (Preflight de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Leer datos JSON del body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (!isset($input['secret_key']) || $input['secret_key'] !== $admin_secret_key) {
    http_response_code(401);
    echo json_encode(["error" => "No autorizado. Clave secreta incorrecta."]);
    exit;
}

if (!isset($input['products']) || !is_array($input['products'])) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan productos para actualizar."]);
    exit;
}

$updated_count = 0;

$stmt = $conn->prepare("INSERT INTO product_prices (product_name, store_name, price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price = VALUES(price)");

foreach ($input['products'] as $product) {
    $name = $product['name'] ?? null;
    $prices = $product['prices'] ?? null; // Ej: ["Mercadona" => 1.25, "Consum" => 1.30]

    if ($name && is_array($prices)) {
        foreach ($prices as $store => $price) {
            $price_float = floatval($price);
            if ($price_float > 0) {
                $stmt->bind_param("ssd", $name, $store, $price_float);
                if ($stmt->execute()) {
                    $updated_count++;
                }
            }
        }
    }
}

$stmt->close();
$conn->close();

echo json_encode(["success" => true, "message" => "$updated_count precios actualizados en la base de datos."]);
?>
