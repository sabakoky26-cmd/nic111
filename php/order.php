<?php
// Тапсырысты қабылдап, MySQL дерекқорына (orders, order_items) сақтайды.
header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Тек POST қабылданады');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) fail(400, 'Дұрыс емес деректер');

$name    = trim(strip_tags($input['name'] ?? ''));
$phone   = trim(strip_tags($input['phone'] ?? ''));
$address = trim(strip_tags($input['address'] ?? ''));

if (mb_strlen($name) < 2)                          fail(422, 'Атыңызды жазыңыз');
if (!preg_match('/^[+\d\s()\-]{10,20}$/', $phone)) fail(422, 'Телефон нөмірі дұрыс емес');
if (mb_strlen($address) < 5)                       fail(422, 'Мекенжайды жазыңыз');

$cfgFile = __DIR__ . '/config.php';
if (!file_exists($cfgFile)) fail(500, 'php/config.php табылмады');
$cfg = require $cfgFile;

try {
    $pdo = new PDO(
        "mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4",
        $cfg['user'], $cfg['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    // Бағаны дерекқордан аламыз (браузерге сенбейміз)
    $priceStmt = $pdo->prepare('SELECT price FROM products WHERE id = ? AND is_active = 1');
    $lines = [];
    $total = 0;
    foreach (($input['items'] ?? []) as $it) {
        $id  = (int)($it['id'] ?? 0);
        $qty = (int)($it['qty'] ?? 0);
        if ($qty < 1 || $qty > 50) continue;
        $priceStmt->execute([$id]);
        $row = $priceStmt->fetch();
        if (!$row) continue;
        $lines[] = [$id, $qty, (int)$row['price']];
        $total  += $qty * (int)$row['price'];
    }
    if (!$lines) fail(422, 'Себет бос');

    $pdo->beginTransaction();
    $pdo->prepare('INSERT INTO orders (customer_name, phone, address, total) VALUES (?,?,?,?)')
        ->execute([$name, $phone, $address, $total]);
    $orderId = (int)$pdo->lastInsertId();

    $ins = $pdo->prepare('INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES (?,?,?,?)');
    foreach ($lines as [$pid, $qty, $price]) {
        $ins->execute([$orderId, $pid, $qty, $price]);
    }
    $pdo->commit();

    echo json_encode(['ok' => true, 'order_id' => $orderId, 'total' => $total]);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log($e->getMessage());
    fail(500, 'Дерекқорға қосыла алмадық');
}
