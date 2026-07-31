-- Crear tabla para almacenar los precios de los productos
CREATE TABLE IF NOT EXISTS `product_prices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_name` varchar(255) NOT NULL,
  `store_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_store_unique` (`product_name`,`store_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para almacenar el estado global de la app
CREATE TABLE IF NOT EXISTS `shared_app_state` (
  `id` int(11) NOT NULL DEFAULT 1,
  `state_json` LONGTEXT NOT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
