<?php
session_start();
require_once '../config/db.php';
require_once 'api_helper.php';

date_default_timezone_set('Europe/Bucharest');

if (!isset($_SESSION['user_id'])) {
    sendResponse(['error' => 'Neautorizat'], 401);
}

$child_id = $_GET['child_id'] ?? null;
$date_filter = $_GET['date'] ?? null;

if (!$child_id) {
    sendResponse(['error' => 'ID-ul copilului este obligatoriu.'], 400);
}

$events = [];

try {
    // hranire
    $stmt = $pdo->prepare("SELECT id, type, created_at, details FROM activities WHERE child_id = ? AND category = 'feeding'");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '🍼',
            'title' => 'Hrană: ' . $r['type'],
            'details' => $r['details'] ?? '',
            'date' => $r['created_at']
        ];
    }

    //somn
    $stmt = $pdo->prepare("SELECT id, created_at, details FROM activities WHERE child_id = ? AND category = 'sleep'");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '😴',
            'title' => 'Somn',
            'details' => $r['details'] ?? '',
            'date' => $r['created_at']
        ];
    }

    // scutece
    $stmt = $pdo->prepare("SELECT id, type, created_at FROM activities WHERE child_id = ? AND category = 'diaper'");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '🧷',
            'title' => 'Scutec: ' . $r['type'],
            'details' => 'Schimbat scutec',
            'date' => $r['created_at']
        ];
    }

   // istoric medical
    $stmt = $pdo->prepare("SELECT id, event_date, diagnosis, treatment, doctor FROM medical_history WHERE child_id = ?");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '🏥',
            'title' => 'Medical: ' . $r['diagnosis'],
            'details' => 'Prescripție: ' . ($r['treatment'] ?: 'N/A') . ' | Medic: ' . ($r['doctor'] ?: '-'),
            'date' => $r['event_date'] . ' 00:00:00'
        ];
    }

    // crestere
    $stmt = $pdo->prepare("SELECT id, weight, height, recorded_date FROM growth WHERE child_id = ?");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '📏',
            'title' => 'Creștere',
            'details' => '⚖️ ' . $r['weight'] . 'kg | 📏 ' . $r['height'] . 'cm',
            'date' => $r['recorded_date'] . ' 00:00:00'
        ];
    }

    //repere
    $stmt = $pdo->prepare("SELECT id, milestone_name, milestone_date FROM milestones WHERE child_id = ?");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '🏆',
            'title' => 'Reper: ' . $r['milestone_name'],
            'details' => 'Bifat!',
            'date' => $r['milestone_date'] . ' 00:00:00'
        ];
    }

     //vaccinuri
    $stmt = $pdo->prepare("SELECT id, name, age_tag, date_administered FROM vaccines WHERE child_id = ? AND status = 1");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $events[] = [
            'icon' => '💉',
            'title' => 'Vaccinare: ' . $r['name'],
            'details' => 'Doza recomandată la: ' . $r['age_tag'],
            'date' => $r['date_administered'] . ' 00:00:00'
        ];
    }
    // dinti
    $stmt = $pdo->prepare("SELECT tooth_id, erupted_date FROM teeth WHERE child_id = ?");
    $stmt->execute([$child_id]);
    foreach ($stmt->fetchAll() as $r) {
        $parts = explode('-', $r['tooth_id']);
        $pozitie = (strpos($r['tooth_id'], 'U') !== false ? 'Sus-' : 'Jos-') . ($parts[1] ?? $r['tooth_id']);
        $events[] = [
            'icon' => '🦷',
            'title' => 'Dinte Nou Erupt!',
            'details' => 'A apărut dințișorul de lapte: ' . $pozitie,
            'date' => $r['erupted_date'] . ' 00:00:00'
        ];
    }

    if ($date_filter) {
        $events = array_filter($events, function($e) use ($date_filter) {
            return substr($e['date'], 0, 10) === $date_filter;
        });
    }

    
    usort($events, function($a, $b) {
        return strcmp($b['date'], $a['date']);
    });

    sendResponse(array_values($events));

} catch (Exception $e) {
    sendResponse(['error' => 'Eroare la generarea fluxului de date: ' . $e->getMessage()], 500);
}