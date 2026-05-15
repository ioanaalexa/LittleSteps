<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Sincronizăm ora
date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Neautorizat']);
    exit;
}

// 1. CREARE AUTOMATĂ TABEL TEETH (Dacă nu există)
$pdo->exec("CREATE TABLE IF NOT EXISTS teeth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    tooth_id TEXT,
    erupted_date TEXT
)");

$method = $_SERVER['REQUEST_METHOD'];

// 2. CITIRE DINȚI (GET)
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    if (!$child_id) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'ID lipsă']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT tooth_id, erupted_date FROM teeth WHERE child_id = ?");
    $stmt->execute([$child_id]);
    
    // Returnăm un format ușor de citit de JS: { "U-1": "2026-05-15", "L-2": "2026-06-01" }
    $results = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    header('Content-Type: application/json');
    echo json_encode($results);
}

// 3. SALVARE DINTE NOU (POST)
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['child_id']) || empty($data['tooth_id']) || empty($data['date'])) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Date incomplete']);
        exit;
    }

    // Salvăm în tabelul de dinți
    $stmt = $pdo->prepare("INSERT INTO teeth (child_id, tooth_id, erupted_date) VALUES (?, ?, ?)");
    $stmt->execute([$data['child_id'], $data['tooth_id'], $data['date']]);

    // Salvăm și în Timeline (activities) ca să apară ca Milestone
    $ora_actuala = $data['date'] . " " . date('H:i:s');
    $nume_dinte = (strpos($data['tooth_id'], 'U') !== false ? "Sus-" : "Jos-") . explode('-', $data['tooth_id'])[1];
    
    $stmtTimeline = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'milestone', '🦷 Dinte Nou!', ?, ?)");
    $stmtTimeline->execute([
        $data['child_id'],
        "A apărut dințișorul: " . $nume_dinte,
        $ora_actuala
    ]);

    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
}
