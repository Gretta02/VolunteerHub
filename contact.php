<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        submitContact();
        break;
    case 'GET':
        getContacts();
        break;
}

function submitContact() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !is_array($data)) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            return;
        }

        // Only allow expected fields and block file uploads or path traversal
        $allowedFields = ['name', 'email', 'subject', 'message'];
        foreach ($data as $key => $value) {
            if (!in_array($key, $allowedFields)) {
                echo json_encode(['success' => false, 'message' => 'Unexpected field detected']);
                return;
            }
            // Prevent path traversal and file upload attempts
            if (preg_match('/\.\.|\/|\\\\/', $value)) {
                echo json_encode(['success' => false, 'message' => 'Invalid input detected']);
                return;
            }
        }

        if (empty($data['name']) || empty($data['email']) || empty($data['subject']) || empty($data['message'])) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        $stmt = $pdo->prepare("INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)");
        $result = $stmt->execute([
            $data['name'],
            $data['email'],
            $data['subject'],
            $data['message']
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Contact form submitted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to insert data']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function getContacts() {
    global $pdo;
    try {
        $stmt = $pdo->query("SELECT * FROM contacts ORDER BY submitted_at DESC");
        if ($stmt === false) {
            echo json_encode(['success' => false, 'message' => 'Failed to fetch contacts']);
            return;
        }
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($contacts);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>