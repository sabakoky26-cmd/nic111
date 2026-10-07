-- Пайдалы сұраулар (қорғау / тексеру үшін мысал)

-- 1. Барлық тауарлар категориясымен
SELECT p.id, p.name, c.name AS category, p.price
FROM products p JOIN categories c ON c.id = p.category_id
WHERE p.is_active = 1
ORDER BY c.name, p.name;

-- 2. Тапсырыс құрамы
SELECT o.id AS order_id, o.customer_name, p.name AS product, i.qty, i.unit_price,
       i.qty * i.unit_price AS line_total
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN products p    ON p.id = i.product_id
ORDER BY o.id;

-- 3. Ең көп сатылған тауарлар
SELECT p.name, SUM(i.qty) AS sold
FROM order_items i JOIN products p ON p.id = i.product_id
GROUP BY p.id, p.name
ORDER BY sold DESC;

-- 4. Күн сайынғы түсім
SELECT DATE(created_at) AS day, COUNT(*) AS orders, SUM(total) AS revenue
FROM orders
WHERE status <> 'cancelled'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- 5. Тапсырыс күйін өзгерту
UPDATE orders SET status = 'confirmed' WHERE id = 1;
