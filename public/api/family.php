<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

if (!isset($_SESSION['user_id'])) sendResponse(['error' => 'Neautorizat'], 401);

$method = $_SERVER['REQUEST_METHOD'];
// id ul din sesiune 
$current_family_id = $_SESSION['family_id'] ?? null;

if (!$current_family_id) {
    sendResponse(['error' => 'Nu s-a detectat ID-ul familiei în sesiune.'], 400);
}

// listare membrii
if ($method === 'GET') {
    ///selectam parintii si copii doar care apartin aceeasi familii 
    $stmtParents = $pdo->prepare("SELECT id, fullname, email, role, gender FROM users WHERE family_id = ?");
    $stmtParents->execute([$current_family_id]);
    $parents = $stmtParents->fetchAll();

    $stmtChildren = $pdo->prepare("SELECT id, name, birthday, gender FROM children WHERE family_id = ?");
    $stmtChildren->execute([$current_family_id]);
    $children = $stmtChildren->fetchAll();
    
    sendResponse(['parents' => $parents, 'children' => $children]);
}

// adaugare membrii
if ($method === 'POST') {
    $data = getJsonInput();
    $type = $data['type']; 

    if ($type === 'child') {
        $stmt = $pdo->prepare("INSERT INTO children (name, birthday, gender, family_id) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['birthday'], $data['gender'], $current_family_id]);
        sendResponse(['message' => 'Copil adăugat!'], 201);
    } 
    
    if ($type === 'parent') {
        $hashedPass = password_hash('familie123', PASSWORD_BCRYPT);
        try {
            // MODIFICAT: Inserăm noul utilizator asociat automat cu aceeași familie (family_id)
            $stmt = $pdo->prepare("INSERT INTO users (email, password, fullname, role, gender, family_id) VALUES (?, ?, ?, 'user', ?, ?)");
            $stmt->execute([
                $data['email'], 
                $hashedPass, 
                $data['fullname'], 
                $data['gender'], // Salvează corect M sau F
                $current_family_id // Legăm ruda de familia curentă
            ]);
            sendResponse(['message' => 'Părinte invitat! Parola: familie123'], 201);
        } catch (Exception $e) {
            sendResponse(['error' => 'Email-ul este deja utilizat.'], 400);
        }
    }
}