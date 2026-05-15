<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

// Sincronizăm ora
date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Neautorizat']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Creăm tabelul dacă nu există
$pdo->exec("CREATE TABLE IF NOT EXISTS vaccines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER,
    name TEXT,
    age_tag TEXT,
    status INTEGER DEFAULT 0,
    date_administered TEXT
)");

if ($method === 'GET') {
    $child_id = $_GET['child_id'] ?? null;
    if (!$child_id) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'ID-ul copilului lipsește']);
        exit;
    }
    
    // Verificăm dacă are deja lista generată
    $stmt = $pdo->prepare("SELECT * FROM vaccines WHERE child_id = ?");
    $stmt->execute([$child_id]);
    $list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($list)) {
        // Generăm schema standard de vaccinare din România
        $default_vaccines = [
            ['BCG', 'Maternitate (2-7 zile)'],
            ['Hepatita B', 'Maternitate (24h)'],
            ['Hexavalent (DTPa-VPI-Hib-HepB)', '2 luni'],
            ['Pneumococi', '2 luni'],
            ['Hexavalent', '4 luni'],
            ['Pneumococi', '4 luni'],
            ['Hexavalent', '11 luni'],
            ['Pneumococi', '11 luni'],
            ['ROR (Rujeolă-Oreion-Rubeolă)', '12 luni']
        ];
        foreach ($default_vaccines as $v) {
            $pdo->prepare("INSERT INTO vaccines (child_id, name, age_tag) VALUES (?, ?, ?)")
                ->execute([$child_id, $v[0], $v[1]]);
        }
        $stmt->execute([$child_id]);
        $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    header('Content-Type: application/json');
    echo json_encode($list);
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $stmt = $pdo->prepare("UPDATE vaccines SET status = ?, date_administered = ? WHERE id = ?");
    $date = ($data['status'] == 1) ? date('Y-m-d') : null;
    $stmt->execute([$data['status'], $date, $data['id']]);
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
}
