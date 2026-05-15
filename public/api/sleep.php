<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat!'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    if (!$child_id) sendResponse(['error' => 'ID lipsă'], 400);

    $stmt = $pdo->prepare("SELECT * FROM activities WHERE category = 'sleep' AND child_id = ? ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    sendResponse($stmt->fetchAll());
} 

if ($method === 'POST') {
    $data = getJsonInput();
    
    if (empty($data['child_id'])) {
        sendResponse(['error' => 'ID copil lipsă.'], 400);
    }

    $ora_actuala = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'sleep', 'Sesiune Somn', ?, ?)");
    $result = $stmt->execute([
        $data['child_id'], 
        $data['details'] ?? 'Somn înregistrat', // Aici ajunge "Durată somn: X minute"
        $ora_actuala
    ]); 
    
    if ($result) {
        sendResponse(['message' => 'Somn salvat!'], 201);
    } else {
        sendResponse(['error' => 'Eroare la salvare.'], 500);
    }
}