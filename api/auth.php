<?php
// api/auth.php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $data = getJsonInput();

    // --- ÎNREGISTRARE ---
    if ($action === 'register') {
        if (empty($data['email']) || empty($data['password'])) {
            sendResponse(['error' => 'Email-ul și parola sunt obligatorii!'], 400);
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
        
        try {
            // Verificăm dacă acesta este primul utilizator din sistem. 
            // Dacă da, îl facem automat ADMIN pentru a avea acces la panou.
            $checkUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $role = ($checkUsers == 0) ? 'admin' : 'user';

            $stmt = $pdo->prepare("INSERT INTO users (email, password, fullname, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['email'], 
                $hashedPassword, 
                $data['fullname'] ?? '', 
                $role
            ]);
            
            sendResponse(['message' => 'Cont creat cu succes ca ' . $role . '!'], 201);
        } catch (PDOException $e) {
            sendResponse(['error' => 'Acest email este deja înregistrat.'], 400);
        }
    }

    // --- LOGIN ---
    if ($action === 'login') {
        if (empty($data['email']) || empty($data['password'])) {
            sendResponse(['error' => 'Introduceți email și parola.'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();

        if ($user && password_verify($data['password'], $user['password'])) {
            // Salvăm datele esențiale în sesiune
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['role'] = $user['role']; // FOARTE IMPORTANT PENTRU ADMIN

            sendResponse([
                'message' => 'Login reușit!',
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'fullname' => $user['fullname']
                ]
            ]);
        } else {
            sendResponse(['error' => 'Email sau parolă incorectă.'], 401);
        }
    }
}

// --- LOGOUT ---
if ($action === 'logout') {
    session_unset();
    session_destroy();
    sendResponse(['message' => 'Te-ai delogat cu succes.']);
}

// --- VERIFICARE STATUS (Util pentru refresh pagină) ---
if ($method === 'GET' && $action === 'status') {
    if (isset($_SESSION['user_id'])) {
        sendResponse([
            'logged_in' => true,
            'user' => [
                'email' => $_SESSION['user_email'],
                'role' => $_SESSION['role']
            ]
        ]);
    } else {
        sendResponse(['logged_in' => false], 401);
    }
}