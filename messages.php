<?php
// Only include config.php from the current directory, preventing path traversal or remote inclusion
$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    error_log("Config file not found or invalid path: {$configPath}");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}
require_once $configPath;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        sendMessage();
        break;
    case 'GET':
        getMessages();
        break;
    case 'PUT':
        markAsRead();
        break;
}

function sendMessage() {
    global $pdo;
    // Ensure the request method is POST and Content-Type is application/json
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || strpos($_SERVER['CONTENT_TYPE'], 'application/json') === false) {
        error_log("Invalid request method or content type");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request method or content type']);
        return;
    }

    $input = file_get_contents('php://input');
    if ($input === false) {
        error_log("Raw input: [Failed to read input]");
        echo json_encode(['success' => false, 'message' => 'Failed to read input']);
        return;
    }
    error_log("Raw input: {$input}");

    // Reject if input contains suspicious file upload patterns
    if (preg_match('/filename=|Content-Disposition:/i', $input)) {
        error_log("Potential file upload detected in input");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File uploads are not allowed']);
        return;
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Decoded data: [JSON decode error: " . json_last_error_msg() . "]");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
        return;
    }
    
    $fromUserId = $data['fromUserId'] ?? $data['from'] ?? null;
    $toUserId = $data['toUserId'] ?? $data['to'] ?? null;
    $message = $data['message'] ?? null;
    
    if (!$fromUserId || !$toUserId || !$message) {
        $error = 'Missing required fields. Received: ' . print_r($data, true);
        error_log($error);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        return;
    }
    
    // Try to insert the new message into the database
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO messages (from_user_id, to_user_id, message, sent_at) VALUES (?, ?, ?, NOW())"
        );
        $result = $stmt->execute([$fromUserId, $toUserId, $message]);
        
        // Log the result of the insert operation
        error_log('Insert result: ' . ($result ? 'success' : 'failed'));
        echo json_encode(['success' => true, 'message' => 'Message sent successfully']);
    } catch (PDOException $e) {
        // Log and return database error
        error_log('Database error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}

function getMessages() {
    global $pdo;
    $userId = $_GET['user_id'] ?? null;
    
    // Try to fetch messages for the given user
    try {
        $stmt = $pdo->prepare("
            SELECT m.*, u.name AS sender_name 
            FROM messages m 
            JOIN users u ON m.from_user_id = u.id 
            WHERE m.to_user_id = ? 
            ORDER BY m.sent_at DESC
        ");
        
        $stmt->execute([$userId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Log the number of messages fetched for the user
        $safeUserId = htmlspecialchars($userId, ENT_QUOTES, 'UTF-8');
        error_log("Messages fetched for user {$safeUserId}: " . count($messages));
        echo json_encode($messages);
    } catch (PDOException $e) {
        // Log and return database error
        error_log("Error fetching messages: " . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
        echo json_encode(['error' => 'Database error']);
    }
}
function markAsRead() {
    global $pdo;
    $input = file_get_contents('php://input');
    if ($input === false) {
        error_log("markAsRead input: [Failed to read input]");
        echo json_encode(['success' => false, 'message' => 'Failed to read input']);
        return;
    }
    error_log("markAsRead input: {$input}");
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("markAsRead data: [JSON decode error: " . json_last_error_msg() . "]");
        echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
        return;
    }
    
    if (!isset($data['messageId'])) {
        error_log("No messageId provided");
        echo json_encode(['success' => false, 'message' => 'No messageId provided']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE messages SET is_read = 1 WHERE id = ?");
        $result = $stmt->execute([$data['messageId']]);
        $rowsAffected = $stmt->rowCount();
        
        error_log('Update result: ' . ($result ? 'success' : 'failed') . ', rows affected: ' . $rowsAffected);
        
        echo json_encode(['success' => true, 'message' => 'Message marked as read', 'rowsAffected' => $rowsAffected]);
    } catch (PDOException $e) {
        error_log('markAsRead error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}
?>