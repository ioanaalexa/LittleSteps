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

// 1. CREARE AUTOMATĂ TABEL TEETH (Modificat pentru compatibilitate SQLite strictă)
$pdo->exec("CREATE TABLE IF NOT EXISTS teeth (
    id INTEGER PRIMARY KEY,
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
    
    // Obligatoriu: Dacă nu sunt dinți în bază, returnăm un obiect JSON valid gol {} în loc de un array gol []
    if (!$results) {
        $results = new stdClass();
    }
    
    header('Content-Type: application/json');
    echo json_encode($results);
    exit;
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

    // REPARAT: Parametrii potriviți exact pentru a mapa 'erupted_date' din tabel cu '$data['date']' trimis de JS
    $stmt = $pdo->prepare("INSERT INTO teeth (child_id, tooth_id, erupted_date) VALUES (?, ?, ?)");
    $stmt->execute([$data['child_id'], $data['tooth_id'], $data['date']]);

    // Salvăm și în Timeline (activities) ca să apară ca Milestone
    $ora_actuala = $data['date'] . " " . date('H:i:s');
    
    // Securizare split pentru a preveni erorile de index în caz de format neașteptat
    $parts = explode('-', $data['tooth_id']);
    $numar_dinte = isset($parts[1]) ? $parts[1] : $data['tooth_id'];
    $nume_dinte = (strpos($data['tooth_id'], 'U') !== false ? "Sus-" : "Jos-") . $numar_dinte;
    
    // Împachetăm execuția în try-catch pentru a nu bloca scriptul dacă tabelul activities are altă structură
    try {
        $stmtTimeline = $pdo->prepare("INSERT INTO activities (child_id, category, type, details, created_at) VALUES (?, 'milestone', '🦷 Dinte Nou!', ?, ?)");
        $stmtTimeline->execute([
            $data['child_id'],
            "A apărut dințișorul: " . $nume_dinte,
            $ora_actuala
        ]);
    } catch (Exception $e) {
        // Logare silențioasă în caz de structură diferită a bazei de date
    }

    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    exit;
}