<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Neautorizat']);
    exit;
}


$pdo->exec("CREATE TABLE IF NOT EXISTS teeth (
    id INTEGER PRIMARY KEY,
    child_id INTEGER,
    tooth_id TEXT,
    erupted_date TEXT
)");

$method = $_SERVER['REQUEST_METHOD'];

// citire dinti
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    if (!$child_id) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'ID lipsă']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT tooth_id, erupted_date FROM teeth WHERE child_id = ?");
    $stmt->execute([$child_id]);
    
    $results = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    if (!$results) {
        $results = new stdClass();
    }
    
    header('Content-Type: application/json');
    echo json_encode($results);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['child_id']) || empty($data['tooth_id']) || empty($data['date'])) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Date incomplete']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO teeth (child_id, tooth_id, erupted_date) VALUES (?, ?, ?)");
    $stmt->execute([$data['child_id'], $data['tooth_id'], $data['date']]);

    $ora_actuala = $data['date'] . " " . date('H:i:s');
    

    $parts = explode('-', $data['tooth_id']);
    $numar_dinte = isset($parts[1]) ? $parts[1] : $data['tooth_id'];
    $nume_dinte = (strpos($data['tooth_id'], 'U') !== false ? "Sus-" : "Jos-") . $numar_dinte;
    
    try {
        $stmtTimeline = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'milestone', '🦷 Dinte Nou!', ?, ?)");
        $stmtTimeline->execute([
            $data['child_id'],
            "A apărut dințișorul: " . $nume_dinte,
            $ora_actuala
        ]);
    } catch (Exception $e) {
    }

    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    exit;
}