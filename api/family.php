<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

if (!isset($_SESSION['user_id'])) sendResponse(['error' => 'Neautorizat'], 401);

$method = $_SERVER['REQUEST_METHOD'];

// LISTARE MEMBRI
if ($method === 'GET') {
    // IMPORTANT: Am adăugat 'gender' în SELECT
    $parents = $pdo->query("SELECT id, fullname, email, role, gender FROM users")->fetchAll();
    $children = $pdo->query("SELECT id, name, birthday, gender FROM children")->fetchAll();
    
    sendResponse(['parents' => $parents, 'children' => $children]);
}

// ADĂUGARE MEMBRU
if ($method === 'POST') {
    $data = getJsonInput();
    $type = $data['type']; 

    if ($type === 'child') {
        $stmt = $pdo->prepare("INSERT INTO children (name, birthday, gender) VALUES (?, ?, ?)");
        $stmt->execute([$data['name'], $data['birthday'], $data['gender']]);
        sendResponse(['message' => 'Copil adăugat!'], 201);
    } 
    
    if ($type === 'parent') {
        $hashedPass = password_hash('familie123', PASSWORD_BCRYPT);
        try {
            // AICI ERA PROBLEMA: Lipsea 'gender' din lista de coloane și valori
            $stmt = $pdo->prepare("INSERT INTO users (email, password, fullname, role, gender) VALUES (?, ?, ?, 'user', ?)");
            $stmt->execute([
                $data['email'], 
                $hashedPass, 
                $data['fullname'], 
                $data['gender'] // Acum salvăm corect M sau F
            ]);
            sendResponse(['message' => 'Părinte invitat! Parola: familie123'], 201);
        } catch (Exception $e) {
            sendResponse(['error' => 'Email-ul este deja utilizat.'], 400);
        }
    }
}