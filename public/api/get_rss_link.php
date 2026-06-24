<?php

require_once '../config/db.php';

// cheia secreta din rss.php
define('RSS_SECRET', 'LittleSteps_Super_Secret_Key_2026');

$child_id = isset($_GET['child_id']) ? (int)$_GET['child_id'] : 0;

if ($child_id > 0) {
    //semnatura
    $token = hash_hmac('sha256', $child_id, RSS_SECRET);
    
    // linkul complet pentru copiere 
    echo json_encode([
        'success' => true,
        'rss_url' => "http://localhost:8000/api/rss.php?child_id={$child_id}&token={$token}"
    ]);
} else {
    echo json_encode(['success' => false]);
}
?>