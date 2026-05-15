<?php
// api/export.php
require_once '../config/db.php';

$format = $_GET['format'] ?? 'json'; // Verificăm ce format vrea utilizatorul (?format=csv)

try {
    // Extragem toate activitățile pentru export
    $stmt = $pdo->query("SELECT * FROM activities ORDER BY created_at DESC");
    $data = $stmt->fetchAll();

    if ($format === 'csv') {
        // Setăm headerele pentru descărcare fișier CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="baby_tracker_export.csv"');
        
        $output = fopen('php://output', 'w');
        
        // Scriem capul de tabel (numele coloanelor)
        if (!empty($data)) {
            fputcsv($output, array_keys($data[0]));
        }
        
        // Scriem datele propriu-zise
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        fclose($output);
    } else {
        // Format implicit: JSON
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="baby_tracker_export.json"');
        echo json_encode($data, JSON_PRETTY_PRINT);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}