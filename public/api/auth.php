<?php
// api/auth.php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Setăm antetul de JSON pentru toate răspunsurile
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $data = getJsonInput();

    // --- 1. LOGICĂ ÎNREGISTRARE (REGISTER) ---
    if ($action === 'register') {
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = $data['password'] ?? '';
        $fullname = trim($data['fullname'] ?? '');

        if (empty($email) || empty($password)) {
            sendResponse(['error' => 'Email-ul și parola sunt obligatorii!'], 400);
        }

        // MODIFICAT: Am dezactivat validarea strictă de email ca să poți introduce date de test simple gen "1"
        /*
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(['error' => 'Formatul email-ului este invalid.'], 400);
        }
        */

        // Hashing securizat (Algoritm BCRYPT)
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        try {
            // NOU: Creăm automat o familie dedicată pentru acest nou utilizator principal
            $numeFamilie = !empty($fullname) ? "Familia " . $fullname : "Familia " . $email;
            $stmtFam = $pdo->prepare("INSERT INTO families (family_name) VALUES (?)");
            $stmtFam->execute([$numeFamilie]);
            $newFamilyId = $pdo->lastInsertId(); // Luăm ID-ul familiei proaspăt create

            // MODIFICAT: Oricine își creează o familie nouă de pe prima pagină devine acum direct Administratorul familiei sale!
            $role = 'family_admin';

            // MODIFICAT: Adăugăm noul utilizator legat direct de ID-ul familiei sale în coloana family_id
            $stmt = $pdo->prepare("INSERT INTO users (email, password, fullname, role, family_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$email, $hashedPassword, $fullname, $role, $newFamilyId]);
            
            sendResponse(['message' => "Cont creat cu succes! Te poți loga ca $role."], 201);
        } catch (PDOException $e) {
            // Eroare 23000 înseamnă de obicei email duplicat (Unique Constraint)
            sendResponse(['error' => 'Acest email este deja utilizat de un alt părinte.'], 400);
        }
    }

    // --- 2. LOGICĂ CONECTARE (LOGIN) ---
    if ($action === 'login') {
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            sendResponse(['error' => 'Te rugăm să introduci email-ul și parola.'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            
            // SECURITATE: Regenerăm ID-ul sesiunii pentru a preveni Session Hijacking
            session_regenerate_id(true);

            // Salvăm informațiile necesare în variabila superglobală $_SESSION
            $_SESSION['user_id']    = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['fullname']   = $user['fullname'];
            $_SESSION['role']       = $user['role'];
            $_SESSION['family_id']  = $user['family_id']; // NOU: Salvăm ID-ul familiei în sesiune

            sendResponse([
                'message' => 'Login reușit!',
                'user' => [
                    'id'        => $user['id'],
                    'email'     => $user['email'],
                    'role'      => $user['role'],
                    'fullname'  => $user['fullname'],
                    'family_id' => $user['family_id'] // NOU: Trimitem și către frontend contextul de familie
                ]
            ]);
        } else {
            sendResponse(['error' => 'Email-ul sau parola sunt incorecte.'], 401);
        }
    }
}

// --- 3. LOGICĂ DECONECTARE (LOGOUT) ---
if ($action === 'logout') {
    // Distrugem toate datele sesiunii
    $_SESSION = array();
    session_destroy();
    
    // Ștergem și cookie-ul de sesiune din browser
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    sendResponse(['message' => 'Sesiune închisă cu succes.']);
}

// --- 4. VERIFICARE STATUS (Pentru refresh-ul paginii în JS) ---
if ($method === 'GET' && $action === 'status') {
    if (isset($_SESSION['user_id'])) {
        sendResponse([
            'logged_in' => true,
            'user' => [
                'id'        => $_SESSION['user_id'],
                'email'     => $_SESSION['user_email'],
                'fullname'  => $_SESSION['fullname'] ?? '',
                'role'      => $_SESSION['role'],
                'family_id' => $_SESSION['family_id'] ?? null // NOU: Întoarcem familia curentă la status check
            ]
        ]);
    } else {
        sendResponse(['logged_in' => false], 401);
    }
}