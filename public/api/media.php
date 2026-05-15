<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Sincronizăm ora cu România
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

    // MODIFICAT: Calea este acum ../assets/uploads/ pentru că api și assets sunt ambele în public
    $targetPath = "../assets/uploads/" . $fileName;

    // Mutăm fișierul fizic pe server
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        
        $ora_actuala = date('Y-m-d H:i:s');

        // Inserăm în DB
        $stmt = $pdo->prepare("INSERT INTO media (child_id, file_path, type, caption, created_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $child_id,
            'assets/uploads/' . $fileName, // Calea relativă pentru baza de date
            $file['type'], 
            $_POST['caption'] ?? '',
            $ora_actuala
        ]);
        
        sendResponse(['message' => 'Amintire salvată cu succes!']);
    } else {
        // Dacă dă eroarea asta, rulează în terminal: chmod 777 public/assets/uploads
        sendResponse(['error' => 'Eroare la salvarea fișierului. Verifică permisiunile folderului uploads!'], 500);
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

    $stmt = $pdo->prepare("SELECT * FROM media WHERE child_id = ? ORDER BY created_at DESC");
    $stmt->execute([$child_id]);
    
    sendResponse($stmt->fetchAll());
}