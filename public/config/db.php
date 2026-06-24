<?php

try {
    $dbPath = __DIR__ . '/../data/database.sqlite';
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $pdo->exec("CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    //Utilizatori
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullname TEXT,
        role TEXT DEFAULT 'user', 
        gender TEXT DEFAULT 'M', -- 'M' pentru Masculin, 'F' pentru Feminin
        family_id INTEGER,       -- ID-ul familiei din care face parte părintele
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // copii
    $pdo->exec("CREATE TABLE IF NOT EXISTS children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birthday DATE,
        gender TEXT DEFAULT 'M', -- 'M' sau 'F'
        family_id INTEGER,       -- ID-ul familiei de care aparține copilul
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // activitati
    $pdo->exec("CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL, 
        category TEXT NOT NULL, 
        type TEXT,              
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // istoric medical
    $pdo->exec("CREATE TABLE IF NOT EXISTS medical_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        event_date DATE NOT NULL,
        diagnosis TEXT NOT NULL,
        treatment TEXT,
        doctor TEXT
    )");

    //multimedia
    $pdo->exec("CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        type TEXT, 
        caption TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // evolutie
    $pdo->exec("CREATE TABLE IF NOT EXISTS growth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        weight REAL, -- Greutate în kg
        height REAL, -- Înălțime în cm
        recorded_date DATE NOT NULL
    )");

    // milestones
    $pdo->exec("CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        milestone_name TEXT NOT NULL,
        milestone_date DATE NOT NULL,
        notes TEXT
    )");
    // vacinuri
    $pdo->exec("CREATE TABLE IF NOT EXISTS vaccines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        age_tag TEXT,
        status INTEGER DEFAULT 0,
        date_administered DATE
    )");

    //dentitie
    $pdo->exec("CREATE TABLE IF NOT EXISTS teeth (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER NOT NULL,
        tooth_id TEXT NOT NULL,
        eruption_date DATE
    )");
} catch (PDOException $e) {
    die("Eroare critică la baza de date: " . $e->getMessage());
}