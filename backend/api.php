<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
$conn->set_charset("utf8mb4");

$action = $_GET['action'] ?? '';

// GET ALL (Replaces get_state.php)
if ($action === 'get_all') {
    // 1. Get Categories
    $categories = [];
    $categoryIcons = [];
    $res = $conn->query("SELECT name, icon FROM categories");
    if (!$res) {
        die(json_encode(["error" => "Error SQL en categories: " . $conn->error]));
    }
    while($row = $res->fetch_assoc()) {
        $categories[] = $row['name'];
        if ($row['icon']) $categoryIcons[$row['name']] = $row['icon'];
    }

    // 2. Get Stores
    $stores = [];
    $storeIcons = [];
    $res = $conn->query("SELECT name, icon FROM stores");
    if (!$res) {
        die(json_encode(["error" => "Error SQL en stores: " . $conn->error]));
    }
    while($row = $res->fetch_assoc()) {
        $stores[] = $row['name'];
        if ($row['icon']) $storeIcons[$row['name']] = $row['icon'];
    }

    // 3. Get Scraped Prices
    $scraped_prices = [];
    $res = $conn->query("SELECT product_name, store_name, price FROM product_prices");
    if ($res) {
        while($p = $res->fetch_assoc()) {
            $scraped_prices[$p['product_name']][$p['store_name']] = (float)$p['price'];
        }
    }

    // 4. Get Products
    $items = [];
    $res = $conn->query("SELECT id, name, category_name, preferred_store, in_list, bought FROM products");
    if (!$res) {
        die(json_encode(["error" => "Error SQL en products: " . $conn->error]));
    }
    while($row = $res->fetch_assoc()) {
        $name = $row['name'];
        $item = [
            "id" => (string)$row['id'],
            "name" => $name,
            "category" => $row['category_name'],
            "preferredStore" => $row['preferred_store'],
            "inList" => (bool)$row['in_list'],
            "bought" => (bool)$row['bought'],
            "prices" => isset($scraped_prices[$name]) ? $scraped_prices[$name] : new stdClass()
        ];
        $items[] = $item;
    }

    echo json_encode([
        "items" => $items,
        "customCategories" => $categories,
        "customStores" => $stores,
        "categoryIcons" => (object)$categoryIcons,
        "storeIcons" => (object)$storeIcons,
        "deletedCategories" => [],
        "deletedStores" => []
    ]);
    exit;
}

// For POST actions, read JSON body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?: [];

if ($action === 'add_category') {
    $name = $input['name'] ?? '';
    $icon = $input['icon'] ?? null;
    $stmt = $conn->prepare("INSERT IGNORE INTO categories (name, icon) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $icon);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'delete_category') {
    $name = $input['name'] ?? '';
    $stmt = $conn->prepare("DELETE FROM categories WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'update_category_icon') {
    $name = $input['name'] ?? '';
    $icon = $input['icon'] ?? null;
    $stmt = $conn->prepare("UPDATE categories SET icon = ? WHERE name = ?");
    $stmt->bind_param("ss", $icon, $name);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'rename_category') {
    $oldName = $input['oldName'] ?? '';
    $newName = $input['newName'] ?? '';
    $icon = $input['icon'] ?? null;
    
    // Si icon no es null, se actualiza también
    if ($icon !== null) {
        $stmt = $conn->prepare("UPDATE categories SET name = ?, icon = ? WHERE name = ?");
        $stmt->bind_param("sss", $newName, $icon, $oldName);
    } else {
        $stmt = $conn->prepare("UPDATE categories SET name = ? WHERE name = ?");
        $stmt->bind_param("ss", $newName, $oldName);
    }
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'add_store') {
    $name = $input['name'] ?? '';
    $icon = $input['icon'] ?? null;
    $stmt = $conn->prepare("INSERT IGNORE INTO stores (name, icon) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $icon);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'delete_store') {
    $name = $input['name'] ?? '';
    $stmt = $conn->prepare("DELETE FROM stores WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'update_store_icon') {
    $name = $input['name'] ?? '';
    $icon = $input['icon'] ?? null;
    $stmt = $conn->prepare("UPDATE stores SET icon = ? WHERE name = ?");
    $stmt->bind_param("ss", $icon, $name);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'rename_store') {
    $oldName = $input['oldName'] ?? '';
    $newName = $input['newName'] ?? '';
    $icon = $input['icon'] ?? null;
    
    if ($icon !== null) {
        $stmt = $conn->prepare("UPDATE stores SET name = ?, icon = ? WHERE name = ?");
        $stmt->bind_param("sss", $newName, $icon, $oldName);
    } else {
        $stmt = $conn->prepare("UPDATE stores SET name = ? WHERE name = ?");
        $stmt->bind_param("ss", $newName, $oldName);
    }
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'add_product') {
    $name = $input['name'] ?? '';
    $category = $input['category'] ?? null;
    $preferredStore = $input['preferredStore'] ?? null;
    $stmt = $conn->prepare("INSERT IGNORE INTO products (name, category_name, preferred_store) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $category, $preferredStore);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'delete_product') {
    $name = $input['name'] ?? '';
    $stmt = $conn->prepare("DELETE FROM products WHERE name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'update_product') {
    $name = $input['name'] ?? '';
    $inList = isset($input['inList']) ? (int)$input['inList'] : null;
    $bought = isset($input['bought']) ? (int)$input['bought'] : null;
    $category = $input['category'] ?? null;
    $preferredStore = $input['preferredStore'] ?? null;
    // Manual price overrides are not fully handled in relational yet, but we will ignore them for now since scraper handles prices.
    
    $query = "UPDATE products SET ";
    $params = [];
    $types = "";
    
    if ($inList !== null) { $query .= "in_list=?,"; $params[] = $inList; $types .= "i"; }
    if ($bought !== null) { $query .= "bought=?,"; $params[] = $bought; $types .= "i"; }
    if ($category !== null) { $query .= "category_name=?,"; $params[] = $category; $types .= "s"; }
    if ($preferredStore !== null) { $query .= "preferred_store=?,"; $params[] = $preferredStore; $types .= "s"; }
    
    $query = rtrim($query, ",");
    $query .= " WHERE name=?";
    $params[] = $name;
    $types .= "s";
    
    if (count($params) > 1) { // Only execute if there's something to update
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
    }
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'update_price') {
    // If user edits a price manually, save to product_prices
    $name = $input['name'] ?? '';
    $store = $input['store'] ?? '';
    $price = isset($input['price']) ? (float)$input['price'] : 0;
    
    if ($name && $store) {
        $stmt = $conn->prepare("INSERT INTO product_prices (product_name, store_name, price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price=?, updated_at=NOW()");
        $stmt->bind_param("ssdd", $name, $store, $price, $price);
        $stmt->execute();
    }
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'clear_list') {
    $conn->query("UPDATE products SET in_list=0, bought=0");
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'finish_trip') {
    $conn->query("UPDATE products SET in_list=0, bought=0 WHERE bought=1");
    echo json_encode(["success" => true]);
    exit;
}

if ($action === 'select_all') {
    $conn->query("UPDATE products SET in_list=1");
    echo json_encode(["success" => true]);
    exit;
}

echo json_encode(["error" => "Acción desconocida"]);
$conn->close();
?>
