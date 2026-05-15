<?php
// api/rss.php
require_once '../config/db.php';

// Setăm header-ul pentru XML (foarte important pentru ca browserul să-l recunoască)
header('Content-Type: application/rss+xml; charset=utf-8');

// Preluăm ultimele 20 de activități din baza de date
try {
    $stmt = $pdo->query("SELECT * FROM activities ORDER BY created_at DESC LIMIT 20");
    $activities = $stmt->fetchAll();
} catch (Exception $e) {
    die("Eroare la generarea fluxului.");
}

// Generăm structura XML a fluxului RSS
echo '<?xml version="1.0" encoding="UTF-8" ?>';
?>
<rss version="2.0">
    <channel>
        <title>LittleSteps - Flux Activități Bebeluș</title>
        <link>http://localhost:8000</link>
        <description>Cele mai recente momente din evoluția bebelușului tău.</description>
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