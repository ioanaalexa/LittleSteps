<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';


date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

///salvare eveniment local
if ($method === 'POST') {
    $data = getJsonInput();
    
    // Validare
    if (empty($data['child_id'])) {
        sendResponse(['error' => 'ID-ul copilului lipsește.'], 400);
    }
    if (empty($data['date']) || empty($data['diagnosis'])) {
        sendResponse(['error' => 'Data și diagnosticul sunt obligatorii.'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO medical_history (child_id, event_date, diagnosis, treatment, doctor) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['child_id'], 
            $data['date'], 
            $data['diagnosis'], 
            $data['treatment'] ?? '', 
            $data['doctor'] ?? ''
        ]);
        
        sendResponse(['message' => 'Eveniment medical salvat cu succes!'], 201);
    } catch (Exception $e) {
        sendResponse(['error' => 'Eroare la salvare: ' . $e->getMessage()], 500);
    }
}

///citire istoric medical
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;

    if (!$child_id) {
        sendResponse(['error' => 'ID-ul copilului nu a fost furnizat.'], 400);
    }

    ///filtrare istoric medical
    $stmt = $pdo->prepare("SELECT * FROM medical_history WHERE child_id = ? ORDER BY event_date DESC");
    $stmt->execute([$child_id]);
    
    sendResponse($stmt->fetchAll());
}