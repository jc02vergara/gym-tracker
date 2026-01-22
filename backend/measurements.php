<?php
require 'config.php';
header('Content-Type: application/json');

/*
  GET /measurements.php?user_id=X
  POST /measurements.php (body: {user_id, weight, id, date})
*/

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing user_id']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM measurements WHERE user_id = ? ORDER BY date DESC");
    $stmt->execute([$userId]);
    $measurements = $stmt->fetchAll();

    echo json_encode($measurements);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? null;
    $weight = $data['weight'] ?? null;
    $chest = $data['chest'] ?? null;
    $waist = $data['waist'] ?? null;
    $arms = $data['arms'] ?? null;
    $legs = $data['legs'] ?? null;
    $id = $data['id'] ?? uniqid();
    $date = $data['date'] ?? date('Y-m-d H:i:s');

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO measurements (id, user_id, weight, chest, waist, arms, legs, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $userId, $weight, $chest, $waist, $arms, $legs, $date]);

    echo json_encode(['success' => true, 'id' => $id]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $weight = $data['weight'] ?? null;
    $chest = $data['chest'] ?? null;
    $waist = $data['waist'] ?? null;
    $arms = $data['arms'] ?? null;
    $legs = $data['legs'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE measurements SET weight = ?, chest = ?, waist = ?, arms = ?, legs = ? WHERE id = ?");
    $stmt->execute([$weight, $chest, $waist, $arms, $legs, $id]);

    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM measurements WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
}
?>