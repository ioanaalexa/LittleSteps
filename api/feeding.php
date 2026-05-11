<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// FIX: Setăm ora României
date_default_timezone_set('Europe/Bucharest');

// Verificăm dacă utilizatorul este logat
if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat! Te rugăm să te loghezi.'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * --- CITIRE DATE (GET) ---
 */
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;

    if (!$child_id) {
        sendResponse(['error' => 'ID-ul copilului lipsește.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM activities WHERE category = 'feeding' AND child_id = ? ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    
    sendResponse($stmt->fetchAll());
} 

/**
 * --- SALVARE DATE (POST) ---
 */
if ($method === 'POST') {
    $data = getJsonInput();
    
    if (empty($data['child_id'])) {
        sendResponse(['error' => 'Trebuie să selectezi un copil.'], 400);
    }
    if (empty($data['type'])) {
        sendResponse(['error' => 'Tipul mesei este obligatoriu.'], 400);
    }

    // FIX: Luăm ora curentă a României
    $ora_actuala = date('Y-m-d H:i:s');

    // Modificăm INSERT-ul să includă coloana created_at manual
    $stmt = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'feeding', ?, ?, ?)");
    $result = $stmt->execute([
        $data['child_id'], 
        $data['type'], 
        $data['details'] ?? '',
        $ora_actuala // Trimitem ora corectă (ex: 10:27 în loc de 07:27)
    ]); 
    
    if ($result) {
        sendResponse(['message' => 'Masă înregistrată cu succes!'], 201);
    } else {
        sendResponse(['error' => 'Eroare la salvare.'], 500);
    }
}