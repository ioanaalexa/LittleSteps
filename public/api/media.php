<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// FIX: Sincronizăm ora cu România
date_default_timezone_set('Europe/Bucharest');

// Verificăm autentificarea
if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

/**
 * --- SALVARE MEDIA (POST) ---
 */
if ($method === 'POST') {
    if (!isset($_FILES['file'])) {
        sendResponse(['error' => 'Niciun fișier selectat'], 400);
    }
    
    $child_id = $_POST['child_id'] ?? null;
    if (!$child_id) {
        sendResponse(['error' => 'ID-ul copilului este obligatoriu.'], 400);
    }

    $file = $_FILES['file'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = time() . '_' . uniqid() . '.' . $ext;
    $targetPath = "../public/assets/uploads/" . $fileName;

    // Mutăm fișierul fizic pe server
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        
        // FIX: Generăm data și ora locală
        $ora_actuala = date('Y-m-d H:i:s');

        // Inserăm în DB incluzând manual coloana created_at
        $stmt = $pdo->prepare("INSERT INTO media (child_id, file_path, type, caption, created_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $child_id,
            'assets/uploads/' . $fileName, 
            $file['type'], 
            $_POST['caption'] ?? '',
            $ora_actuala // Trimitem ora 10:30 (București)
        ]);
        
        sendResponse(['message' => 'Amintire salvată cu succes!']);
    } else {
        sendResponse(['error' => 'Eroare la salvarea fișierului pe server.'], 500);
    }
}

/**
 * --- CITIRE GALERIE (GET) ---
 */
if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;

    if (!$child_id) {
        sendResponse(['error' => 'ID-ul copilului lipsește.'], 400);
    }

    // Luăm pozele ordonate după data corectă
    $stmt = $pdo->prepare("SELECT * FROM media WHERE child_id = ? ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    
    sendResponse($stmt->fetchAll());
}