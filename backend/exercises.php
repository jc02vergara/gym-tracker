<?php
require 'config.php';
header('Content-Type: application/json');

/*
  POST /exercises.php (body: {routine_id, name, id})
  DELETE /exercises.php (body: {id})
*/

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $routineId = $data['routine_id'] ?? null;
    $name = $data['name'] ?? null;
    $id = $data['id'] ?? uniqid();

    if (!$routineId || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing data']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO exercises (id, routine_id, name) VALUES (?, ?, ?)");
    $stmt->execute([$id, $routineId, $name]);

    echo json_encode(['success' => true, 'id' => $id]);
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM exercises WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
}
?>