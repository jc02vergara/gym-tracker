<?php
require 'config.php';
header('Content-Type: application/json');

/*
  GET /logs.php?user_id=X
  POST /logs.php (body: {user_id, exercise_id, weight, reps, id, date})
*/

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing user_id']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM logs WHERE user_id = ? ORDER BY date DESC");
    $stmt->execute([$userId]);
    $logs = $stmt->fetchAll();

    echo json_encode($logs);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? null;
    $exerciseId = $data['exercise_id'] ?? null;
    $weight = $data['weight'] ?? 0;
    $reps = $data['reps'] ?? 0;
    $id = $data['id'] ?? uniqid();
    $date = $data['date'] ?? date('Y-m-d H:i:s');

    if (!$userId || !$exerciseId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO logs (id, user_id, exercise_id, weight, reps, date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $userId, $exerciseId, $weight, $reps, $date]);

    echo json_encode(['success' => true, 'id' => $id]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $weight = $data['weight'] ?? null;
    $reps = $data['reps'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE logs SET weight = ?, reps = ? WHERE id = ?");
    $stmt->execute([$weight, $reps, $id]);

    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM logs WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
}
?>