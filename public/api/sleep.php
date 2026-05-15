<?php
// api/sleep.php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// FIX: Setăm fusul orar pentru România (EEST)
date_default_timezone_set('Europe/Bucharest');

// Protecție: doar utilizatorii logați pot accesa datele
if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat!'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * --- SALVARE SOMN (POST) ---
 */
if ($method === 'POST') {
    $data = getJsonInput();
    
    // Validare: ID-ul copilului este obligatoriu
    if (empty($data['child_id'])) {
        sendResponse(['error' => 'ID-ul copilului lipsește din cerere.'], 400);
    }
    
    try {
        // FIX: Generăm ora curentă a României
        $ora_actuala = date('Y-m-d H:i:s');

        // Adăugăm manual created_at în INSERT pentru a suprascrie ora UTC a bazei de date
        $stmt = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'sleep', 'Somn', ?, ?)");
        $stmt->execute([
            $data['child_id'], 
            $data['details'] ?? 'Sesiune de somn',
            $ora_actuala // Ora ta locală
        ]);
        
        sendResponse(['message' => 'Somn salvat cu succes!'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Eroare server: ' . $e->getMessage()], 500);
    }
}

/**
 * --- CITIRE SOMN (GET) ---
 */
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;

    if (!$child_id) {
        sendResponse(['error' => 'ID-ul copilului lipsește.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM activities WHERE category = 'sleep' AND child_id = ? ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    
    sendResponse($stmt->fetchAll());
}