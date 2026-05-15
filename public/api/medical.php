<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// FIX: Setăm fusul orar pentru România
date_default_timezone_set('Europe/Bucharest');

// Verificăm dacă utilizatorul este logat
if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * --- SALVARE EVENIMENT MEDICAL (POST) ---
 */
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
        // Salvăm evenimentul medical
        $stmt = $pdo->prepare("INSERT INTO medical_history (child_id, event_date, diagnosis, treatment, doctor) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['child_id'], 
            $data['date'], // Data aleasă de tine în formular (YYYY-MM-DD)
            $data['diagnosis'], 
            $data['treatment'] ?? '', 
            $data['doctor'] ?? ''
        ]);
        
        sendResponse(['message' => 'Eveniment medical salvat cu succes!'], 201);
    } catch (Exception $e) {
        sendResponse(['error' => 'Eroare la salvare: ' . $e->getMessage()], 500);
    }
}

/**
 * --- CITIRE ISTORIC MEDICAL (GET) ---
 */
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;

    if (!$child_id) {
        sendResponse(['error' => 'ID-ul copilului nu a fost furnizat.'], 400);
    }

    // Filtrăm istoricul medical pentru copilul selectat
    $stmt = $pdo->prepare("SELECT * FROM medical_history WHERE child_id = ? ORDER BY event_date DESC");
    $stmt->execute([$child_id]);
    
    sendResponse($stmt->fetchAll());
}