<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Verificare strictă de securitate
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendResponse(['error' => 'Acces interzis! Doar administratorii pot vedea asta.'], 403);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Luăm toți utilizatorii și numărul lor de activități
    $query = "SELECT u.id, u.email, u.fullname, u.role, COUNT(a.id) as activity_count 
              FROM users u 
              LEFT JOIN activities a ON u.id = a.child_id 
              GROUP BY u.id";
    $stmt = $pdo->query($query);
    sendResponse($stmt->fetchAll());
}

if ($method === 'DELETE') {
    // Exemplu: Ștergerea unui utilizator (din URL: admin.php?id=5)
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['message' => 'Utilizator șters!']);
    }
}