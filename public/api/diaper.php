<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Setăm fusul orar pentru a avea ora corectă în Timeline
date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Neautorizat']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// 1. PRELUARE ISTORIC SCUTECE (GET)
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    if (!$child_id) {
        echo json_encode([]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, type, created_at FROM activities WHERE child_id = ? AND category = 'diaper' ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($results);
}

// 2. SALVARE SCUTEC NOU (POST)
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['child_id']) || empty($data['type'])) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Date incomplete']);
        exit;
    }

    $ora_actuala = date('Y-m-d H:i:s');
    
    // Inserăm în tabelul activities cu categoria 'diaper'
    $stmt = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'diaper', ?, 'Schimbat scutec', ?)");
    $stmt->execute([
        $data['child_id'], 
        $data['type'], 
        $ora_actuala
    ]);

    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
}
