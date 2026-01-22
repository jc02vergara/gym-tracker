<?php
require 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (!$data) {
        $data = $_POST;
    }
    $action = $data['action'] ?? 'login';

    if ($action === 'login') {
        $username = $data['username'] ?? '';
        // En un caso real validamos password. Aquí simplificaremos para migración rápida si el usuario solo quiere 'nombre' como antes,
        // pero el requerimiento dice "tabla de usuario y contraseña".
        // Asumiremos que el frontend enviará password también. Si no, usaremos un default para el usuario legacy.

        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['username']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Credenciales inválidas']);
        }
    } elseif ($action === 'register') {
        // Implementación básica de registro
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan datos']);
            exit;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
            $stmt->execute([$username, $hash]);

            $userId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $userId,
                    'name' => $username
                ]
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                http_response_code(409);
                echo json_encode(['error' => 'El usuario ya existe']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al registrar']);
            }
        }
    }
}
?>