<?php
/**
 * config/db.php
 * Structura actualizată pentru suport Gen (M/F) și filtrare activități.
 */

try {
    $dbPath = __DIR__ . '/../data/database.sqlite';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 1. Tabel Utilizatori (Părinți/Admini)
    // Am adăugat coloana 'gender' pentru a distinge între 👨 (M) și 👩 (F)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullname TEXT,
        role TEXT DEFAULT 'user', 
        gender TEXT DEFAULT 'M', -- 'M' pentru Masculin, 'F' pentru Feminin
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Tabel Copii (Membrii familiei monitorizați)
    // Coloana 'gender' va determina dacă afișăm 👦 (M) sau 👧 (F)
    $pdo->exec("CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birthday DATE,
        gender TEXT DEFAULT 'M', -- 'M' sau 'F'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 3. Tabel Activități (Hrană, Somn)
    // Filtrarea se va face strict prin child_id
    $pdo->exec("CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL, 
        category TEXT NOT NULL, 
        type TEXT,              
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 4. Tabel Istoric Medical
    $pdo->exec("CREATE TABLE IF NOT EXISTS medical_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        event_date DATE NOT NULL,
        diagnosis TEXT NOT NULL,
        treatment TEXT,
        doctor TEXT
    )");

    // 5. Tabel Multimedia (Galerie)
    $pdo->exec("CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        type TEXT, 
        caption TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

// Tabel Evoluție (Înălțime/Greutate)
$pdo->exec("CREATE TABLE IF NOT EXISTS growth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    weight REAL, -- Greutate în kg
    height REAL, -- Înălțime în cm
    recorded_date DATE NOT NULL
)");

// Tabel Milestones (Momente importante)
$pdo->exec("CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    milestone_name TEXT NOT NULL,
    milestone_date DATE NOT NULL,
    notes TEXT
)");

} catch (PDOException $e) {
    die("Eroare critică la baza de date: " . $e->getMessage());
}