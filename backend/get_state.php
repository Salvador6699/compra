<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'config.php';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida: " . $conn->connect_error]));
}

$sql = "SELECT state_json FROM shared_app_state WHERE id = 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $state = json_decode($row["state_json"], true);
    
    // Merge scraped prices from product_prices table
    $prices_sql = "SELECT product_name, store_name, price FROM product_prices";
    $prices_result = $conn->query($prices_sql);
    
    $scraped_prices = [];
    if ($prices_result->num_rows > 0) {
        while($p = $prices_result->fetch_assoc()) {
            $scraped_prices[$p['product_name']][$p['store_name']] = (float)$p['price'];
        }
    }
    
    // Inject scraped prices into state items
    if (isset($state['items']) && is_array($state['items'])) {
        foreach ($state['items'] as &$item) {
            $name = $item['name'];
            if (isset($scraped_prices[$name])) {
                if (!isset($item['prices'])) $item['prices'] = [];
                foreach ($scraped_prices[$name] as $store => $price) {
                    $item['prices'][$store] = $price;
                }
            }
        }
    }
    
    echo json_encode($state);
} else {
    echo json_encode(["empty" => true]);
}

$conn->close();
?>
