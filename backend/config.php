<?php
// backend/config.php

// Configuración de la base de datos (rellenar con los datos del hosting compartido)
$db_host = 'localhost';
$db_user = 'myplantrabb3'; // Usuario de la base de datos
$db_pass = 'Ganbaru@6699';     // Contraseña de la base de datos
$db_name = 'compra2';

// Clave secreta para que solo el Admin pueda actualizar precios
$admin_secret_key = 'Ganbaru@6699'; // ¡CÁMBIALA!

// Conexión a la base de datos
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");
?>