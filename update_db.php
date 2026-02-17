<?php
require 'backend/config.php';

try {
    // Add 'sets' column if it doesn't exist
    $pdo->exec("ALTER TABLE logs ADD COLUMN sets INT(11) DEFAULT 4");
    echo "Added 'sets' column.\n";
} catch (PDOException $e) {
    echo "Column 'sets' might already exist or error: " . $e->getMessage() . "\n";
}

try {
    // Add 'completed_sets' column if it doesn't exist
    $pdo->exec("ALTER TABLE logs ADD COLUMN completed_sets INT(11) DEFAULT 0");
    echo "Added 'completed_sets' column.\n";
} catch (PDOException $e) {
    echo "Column 'completed_sets' might already exist or error: " . $e->getMessage() . "\n";
}

echo "Database update complete.";
?>
