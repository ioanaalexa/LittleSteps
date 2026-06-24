<?php
require_once '../config/db.php';
header('Content-Type: application/json');


$data = json_decode(file_get_contents('php://input'), true);

$child_id = isset($data['child_id']) ? (int)$data['child_id'] : 0;
$new_name = isset($data['name']) ? trim($data['name']) : '';

if ($child_id <= 0 || empty($new_name)) {
    echo json_encode(['success' => false, 'error' => 'Date invalide sau nume gol.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE children SET name = ? WHERE id = ?");
    $stmt->execute([$new_name, $child_id]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Eroare la baza de date.']);
}
?>