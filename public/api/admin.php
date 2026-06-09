<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Acces interzis!'], 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$current_family_id = $_SESSION['family_id'] ?? null;

// Aici e cheia care separă copiii de părinți!
$type = $_GET['type'] ?? 'users'; 

if ($method === 'GET') {
    if ($type === 'children') {
        $stmt = $pdo->prepare("SELECT id, name, birthday FROM children WHERE family_id = ?");
        $stmt->execute([$current_family_id]);
        sendResponse($stmt->fetchAll());
    } else {
        $query = "SELECT u.id, u.email, u.fullname, u.role FROM users u WHERE u.family_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$current_family_id]);
        sendResponse($stmt->fetchAll());
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        if ($type === 'children') {
            $stmt = $pdo->prepare("DELETE FROM children WHERE id = ? AND family_id = ?");
            $stmt->execute([$id, $current_family_id]);
            sendResponse(['message' => 'Copil șters!']);
        } else {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND family_id = ?");
            $stmt->execute([$id, $current_family_id]);
            sendResponse(['message' => 'Cont șters!']);
        }
    } else {
        sendResponse(['error' => 'ID invalid!'], 400);
    }
}
?>