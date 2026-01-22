<?php
require 'config.php';
header('Content-Type: application/json');

/*
  GET /routines.php?user_id=X
  POST /routines.php (body: {user_id, name})
  PUT /routines.php (body: {id, name})
  DELETE /routines.php (body: {id})
*/

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing user_id']);
        exit;
    }

    // Fetch routines
    $stmt = $pdo->prepare("SELECT * FROM routines WHERE user_id = ? ORDER BY created_at ASC");
    $stmt->execute([$userId]);
    $routines = $stmt->fetchAll();

    // Fetch exercises for each routine
    foreach ($routines as &$routine) {
        $stmtEx = $pdo->prepare("SELECT * FROM exercises WHERE routine_id = ? ORDER BY created_at ASC");
        $stmtEx->execute([$routine['id']]);
        $routine['exercises'] = $stmtEx->fetchAll();
    }

    echo json_encode($routines);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? null;
    $name = $data['name'] ?? null;

    if (!$userId || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    $id = $data['id'] ?? uniqid(); // Frontend provides UUID or we generate one

    $stmt = $pdo->prepare("INSERT INTO routines (id, user_id, name) VALUES (?, ?, ?)");
    $stmt->execute([$id, $userId, $name]);

    echo json_encode(['success' => true, 'id' => $id]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $name = $data['name'] ?? null;

    if (!$id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE routines SET name = ? WHERE id = ?");
    $stmt->execute([$name, $id]);

    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM routines WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
}
?>