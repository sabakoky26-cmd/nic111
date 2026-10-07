-- STYLE киім дүкені — дерекқор (MySQL / MariaDB)
-- Іске қосу: mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS style_shop
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE style_shop;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

-- Категориялар
CREATE TABLE categories (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Тауарлар
CREATE TABLE products (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  price       INT UNSIGNED NOT NULL,          -- теңгемен
  image_url   VARCHAR(255) NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Тапсырыстар
CREATE TABLE orders (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  address       VARCHAR(255) NOT NULL,
  total         INT UNSIGNED NOT NULL,
  status        ENUM('new','confirmed','shipped','delivered','cancelled')
                NOT NULL DEFAULT 'new',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- Тапсырыс құрамы (бір тапсырыста бірнеше тауар)
CREATE TABLE order_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  qty        SMALLINT UNSIGNED NOT NULL,
  unit_price INT UNSIGNED NOT NULL,           -- тапсырыс кезіндегі баға
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Бастапқы деректер
INSERT INTO categories (id, name) VALUES
  (1,'Футболка'),(2,'Худи'),(3,'Джинсы'),(4,'Куртка'),(5,'Жейде'),(6,'Шалбар');

INSERT INTO products (id, category_id, name, price, image_url) VALUES
  (1,1,'Oversize T-Shirt', 8990,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'),
  (2,2,'Classic Hoodie',  15990,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600'),
  (3,3,'Blue Jeans',      18990,'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'),
  (4,4,'Leather Jacket',  34990,'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'),
  (5,5,'White Shirt',     12990,'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600'),
  (6,6,'Cargo Pants',     16990,'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600');
