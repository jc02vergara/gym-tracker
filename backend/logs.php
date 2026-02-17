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
    $sets = $data['sets'] ?? 4;
    $completedSets = $data['completed_sets'] ?? 0;
    $id = $data['id'] ?? uniqid();
    $date = $data['date'] ?? date('Y-m-d H:i:s');

    if (!$userId || !$exerciseId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO logs (id, user_id, exercise_id, weight, reps, sets, completed_sets, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $userId, $exerciseId, $weight, $reps, $sets, $completedSets, $date]);

    echo json_encode(['success' => true, 'id' => $id]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $weight = $data['weight'] ?? null;
    $reps = $data['reps'] ?? null;
    $sets = $data['sets'] ?? null;
    $completedSets = $data['completed_sets'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    // Build dynamic update query
    $fields = [];
    $params = [];
    
    if ($weight !== null) { $fields[] = 'weight = ?'; $params[] = $weight; }
    if ($reps !== null) { $fields[] = 'reps = ?'; $params[] = $reps; }
    if ($sets !== null) { $fields[] = 'sets = ?'; $params[] = $sets; }
    if ($completedSets !== null) { $fields[] = 'completed_sets = ?'; $params[] = $completedSets; }

    if (empty($fields)) {
         echo json_encode(['success' => true]);
         exit;
    }

    $params[] = $id;
    $sql = "UPDATE logs SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

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