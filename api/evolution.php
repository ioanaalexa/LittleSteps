<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

if (!isset($_SESSION['user_id'])) sendResponse(['error' => 'Neautorizat'], 401);

$method = $_SERVER['REQUEST_METHOD'];
$child_id = $_GET['child_id'] ?? null;

if ($method === 'GET') {
    if (!$child_id) sendResponse(['error' => 'Lipsă ID copil'], 400);

    $growth = $pdo->prepare("SELECT * FROM growth WHERE child_id = ? ORDER BY recorded_date DESC");
    $growth->execute([$child_id]);

    $milestones = $pdo->prepare("SELECT * FROM milestones WHERE child_id = ? ORDER BY milestone_date DESC");
    $milestones->execute([$child_id]);

    sendResponse([
        'growth' => $growth->fetchAll(),
        'milestones' => $milestones->fetchAll()
    ]);
}

if ($method === 'POST') {
    $data = getJsonInput();
    $target = $data['target']; // 'growth' sau 'milestone'

    if ($target === 'growth') {
        $stmt = $pdo->prepare("INSERT INTO growth (child_id, weight, height, recorded_date) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['child_id'], $data['weight'], $data['height'], $data['date']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO milestones (child_id, milestone_name, milestone_date, notes) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['child_id'], $data['name'], $data['date'], $data['notes'] ?? '']);
    }
    sendResponse(['message' => 'Salvat cu succes!']);
}