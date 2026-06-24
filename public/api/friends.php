<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

if (!isset($_SESSION['user_id'])) sendResponse(['error' => 'Neautorizat'], 401);

$current_family_id = $_SESSION['family_id'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

$pdo->exec("CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    details TEXT,
    family_id INTEGER NOT NULL,
    child_id INTEGER DEFAULT 0
)");

try {
    $pdo->exec("ALTER TABLE friends ADD COLUMN child_id INTEGER DEFAULT 0");
} catch (Exception $e) {}

if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    
    if ($child_id) {
        // cauta prietenii sau prietenii comuni
        $stmt = $pdo->prepare("SELECT * FROM friends WHERE family_id = ? AND (child_id = ? OR child_id = 0)");
        $stmt->execute([$current_family_id, $child_id]);
    } else {
        //pentru panoul de adminstrare aduce tot
        $stmt = $pdo->prepare("SELECT * FROM friends WHERE family_id = ?");
        $stmt->execute([$current_family_id]);
    }
    sendResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $data = getJsonInput();
    if (empty($data['name']) || empty($data['relation'])) {
        sendResponse(['error' => 'Numele și relația sunt obligatorii!'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO friends (name, relation, details, family_id, child_id) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$data['name'], $data['relation'], $data['details'], $current_family_id, $data['child_id']])) {
        sendResponse(['message' => 'Persoană adăugată!'], 201);
    } else {
        sendResponse(['error' => 'Eroare la salvare.'], 500);
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM friends WHERE id = ? AND family_id = ?");
        if ($stmt->execute([$id, $current_family_id])) {
            sendResponse(['message' => 'Persoană ștearsă cu succes!']);
        } else {
            sendResponse(['error' => 'Eroare ștergere.'], 500);
        }
    } else {
        sendResponse(['error' => 'ID invalid!'], 400);
    }
}
?>