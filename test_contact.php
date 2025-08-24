<?php
// Test script for contact form database connection
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Contact Form Database Test</h2>";

// Test 1: Database connection
try {
    $pdo = new PDO('mysql:host=localhost;dbname=volunteer_hub', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color: green;'>✓ Database connection successful</p>";
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Database connection failed: " . $e->getMessage() . "</p>";
    exit;
}

// Test 2: Check if contacts table exists
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'contacts'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✓ Contacts table exists</p>";
    } else {
        echo "<p style='color: red;'>✗ Contacts table does not exist</p>";
        echo "<p>Creating contacts table...</p>";
        
        $createTable = "CREATE TABLE contacts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            subject VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        $pdo->exec($createTable);
        echo "<p style='color: green;'>✓ Contacts table created successfully</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Table check failed: " . $e->getMessage() . "</p>";
}

// Test 3: Test insert
try {
    $stmt = $pdo->prepare("INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)");
    $result = $stmt->execute(['Test User', 'test@example.com', 'general', 'Test message from script']);
    
    if ($result) {
        echo "<p style='color: green;'>✓ Test insert successful</p>";
        
        // Show recent contacts
        $stmt = $pdo->query("SELECT * FROM contacts ORDER BY submitted_at DESC LIMIT 5");
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>Recent Contacts:</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Submitted At</th></tr>";
        
        foreach ($contacts as $contact) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($contact['id']) . "</td>";
            echo "<td>" . htmlspecialchars($contact['name']) . "</td>";
            echo "<td>" . htmlspecialchars($contact['email']) . "</td>";
            echo "<td>" . htmlspecialchars($contact['subject']) . "</td>";
            echo "<td>" . htmlspecialchars(substr($contact['message'], 0, 50)) . "...</td>";
            echo "<td>" . htmlspecialchars($contact['submitted_at']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p style='color: red;'>✗ Test insert failed</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Insert test failed: " . $e->getMessage() . "</p>";
}

echo "<br><p><a href='pages/contact.html'>Go back to contact form</a></p>";
?>