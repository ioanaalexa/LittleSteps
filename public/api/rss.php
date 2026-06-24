<?php

require_once '../config/db.php';

define('RSS_SECRET', 'LittleSteps_Super_Secret_Key_2026');

// id ul si tokenul din link
$child_id = isset($_GET['child_id']) ? (int)$_GET['child_id'] : 0;
$token = isset($_GET['token']) ? $_GET['token'] : '';

if ($child_id <= 0 || empty($token)) {
    http_response_code(400);
    die("Eroare: Parametrii lipsesc. Link-ul RSS este invalid.");
}
///validare securitate prevenire idor
$expected_token = hash_hmac('sha256', $child_id, RSS_SECRET);

if (!hash_equals($expected_token, $token)) {
    http_response_code(403);
    die("Eroare 403: Acces interzis. Semnătura digitală este invalidă.");
}

// headerul xml
header('Content-Type: application/rss+xml; charset=utf-8');

try {
    
    $stmtName = $pdo->prepare("SELECT name FROM children WHERE id = ?");
    $stmtName->execute([$child_id]);
    $child = $stmtName->fetch();

    if (!$child) {
        die("Eroare: Copilul nu există în baza de date.");
    }
    $nume_copil = htmlspecialchars($child['name']);

    //preluare activitati
    $stmt = $pdo->prepare("SELECT * FROM activities WHERE child_id = ? ORDER BY created_at DESC LIMIT 20");
    $stmt->execute([$child_id]);
    $activities = $stmt->fetchAll();

} catch (Exception $e) {
    die("Eroare la generarea fluxului.");
}

// generare rss
echo '<?xml version="1.0" encoding="UTF-8" ?>';
?>
<rss version="2.0">
    <channel>
        <title>LittleSteps - Flux Activități: <?php echo $nume_copil; ?></title>
        <link>http://localhost:8000</link>
        <description>Cele mai recente momente din evoluția lui <?php echo $nume_copil; ?>.</description>
        <language>ro-ro</language>

        <?php foreach ($activities as $item): ?>
        <item>
            <title><?php 
                echo ($item['category'] === 'feeding' ? '🍼 Hrană' : '😴 Somn') . ' - ' . htmlspecialchars($item['type']); 
            ?></title>
            <link>http://localhost:8000/public/index.html#timeline</link>
            <description><?php echo htmlspecialchars($item['details']); ?></description>
            <pubDate><?php echo date(DATE_RSS, strtotime($item['created_at'])); ?></pubDate>
            <guid>activity-<?php echo $item['id']; ?></guid>
        </item>
        <?php endforeach; ?>
    </channel>
</rss>