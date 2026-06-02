<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Verificare strictă de securitate adaptată pentru noile roluri
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'family_admin'])) {
    sendResponse(['error' => 'Acces interzis! Doar administratorii pot vedea asta.'], 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$current_role = $_SESSION['role'];
$current_family_id = $_SESSION['family_id'] ?? null;

if ($method === 'GET') {
    if ($current_role === 'admin') {
        // Super-Administratorul global vede în continuare toți utilizatorii din sistem
        $query = "SELECT u.id, u.email, u.fullname, u.role, COUNT(a.id) as activity_count 
                  FROM users u 
                  LEFT JOIN activities a ON u.id = a.child_id 
                  GROUP BY u.id";
        $stmt = $pdo->query($query);
        sendResponse($stmt->fetchAll());
    } else {
        // Administratorul de familie vede DOAR utilizatorii care aparțin de familia lui
        $query = "SELECT u.id, u.email, u.fullname, u.role, COUNT(a.id) as activity_count 
                  FROM users u 
                  LEFT JOIN activities a ON u.id = a.child_id 
                  WHERE u.family_id = ?
                  GROUP BY u.id";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$current_family_id]);
        sendResponse($stmt->fetchAll());
    }
}

if ($method === 'DELETE') {
    // Exemplu: Ștergerea unui utilizator (din URL: admin.php?id=5)
    $id = $_GET['id'] ?? null;
    if ($id) {
        if ($current_role === 'admin') {
            // Super-Adminul global are dreptul să șteargă orice ID
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['message' => 'Utilizator șters!']);
        } else {
            // Administratorul de familie poate șterge un ID doar dacă face parte din familia sa
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND family_id = ?");
            $stmt->execute([$id, $current_family_id]);
            sendResponse(['message' => 'Utilizator șters din familie!']);
        }
    }
}