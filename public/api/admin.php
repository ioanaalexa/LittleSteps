<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Verificare de bază: Utilizatorul trebuie să fie obligatoriu logat
if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Acces interzis! Te rugăm să te conectezi.'], 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$current_role = $_SESSION['role'] ?? 'user';
$current_family_id = $_SESSION['family_id'] ?? null;

if ($method === 'GET') {
    // MODIFICAT: Toată lumea (inclusiv contul 'admin' global) vede DOAR utilizatorii care aparțin strict de familia proprie
    $query = "SELECT u.id, u.email, u.fullname, u.role, COUNT(a.id) as activity_count 
              FROM users u 
              LEFT JOIN activities a ON u.id = a.child_id 
              WHERE u.family_id = ?
              GROUP BY u.id";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$current_family_id]);
    sendResponse($stmt->fetchAll());
}

if ($method === 'DELETE') {
    // Exemplu: Ștergerea unui utilizator (din URL: admin.php?id=5)
    $id = $_GET['id'] ?? null;
    if ($id) {
        if ($current_role === 'admin') {
            // Super-Adminul global are dreptul să șteargă orice ID (păstrat pentru siguranță/mentenanță)
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['message' => 'Utilizator șters!']);
        } else {
            // Administratorul de familie poate șterge un ID doar dacă face parte strict din familia sa
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND family_id = ?");
            $stmt->execute([$id, $current_family_id]);
            sendResponse(['message' => 'Utilizator șters din familie!']);
        }
    }
}