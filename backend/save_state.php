<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require 'config.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (!isset($input['state_json'])) {
    die(json_encode(["success" => false, "message" => "Falta state_json en la petición."]));
}

$state_json = $input['state_json'];

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Conexión fallida: " . $conn->connect_error]));
}

$stmt = $conn->prepare("INSERT INTO shared_app_state (id, state_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE state_json = ?, updated_at = NOW()");
$stmt->bind_param("ss", $state_json, $state_json);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Estado guardado correctamente."]);
} else {
    echo json_encode(["success" => false, "message" => "Error al guardar: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
