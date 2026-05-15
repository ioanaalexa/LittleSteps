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

    $stmt = $pdo->prepare("SELECT * FROM activities WHERE category = 'feeding' AND child_id = ? ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    sendResponse($stmt->fetchAll());
} 

if ($method === 'POST') {
    $data = getJsonInput();
    
    if (empty($data['child_id']) || empty($data['type'])) {
        sendResponse(['error' => 'Date incomplete (copil sau descriere masă).'], 400);
    }

    $ora_actuala = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'feeding', ?, ?, ?)");
    $result = $stmt->execute([
        $data['child_id'], 
        $data['type'], // Aici ajunge textul scris de tine (ex: "120ml lapte")
        $data['details'] ?? 'Înregistrat din Jurnal',
        $ora_actuala
    ]); 
    
    if ($result) {
        sendResponse(['message' => 'Masă salvată!'], 201);
    } else {
        sendResponse(['error' => 'Eroare la salvare.'], 500);
    }
}