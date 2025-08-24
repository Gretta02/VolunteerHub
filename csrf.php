<?php
require_once 'config.php';

// CSRF Token Management

function generateCSRFToken($userId = null) {
    global $pdo;
    
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
    
    try {
        // Clean expired tokens
        $stmt = $pdo->prepare("DELETE FROM csrf_tokens WHERE expires_at < NOW()");
        $stmt->execute();
        
        // Insert new token
        $stmt = $pdo->prepare("INSERT INTO csrf_tokens (token, user_id, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$token, $userId, $expiresAt]);
        
        return $token;
    } catch (Exception $e) {
        error_log("CSRF token generation error: " . $e->getMessage());
        return false;
    }
}

function validateCSRFToken($token, $userId = null) {
    global $pdo;
    
    if (!$token) {
        return false;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM csrf_tokens WHERE token = ? AND expires_at > NOW() AND (user_id = ? OR user_id IS NULL)");
        $stmt->execute([$token, $userId]);
        
        $result = $stmt->fetch();
        
        if ($result) {
            // Delete used token (one-time use)
            $stmt = $pdo->prepare("DELETE FROM csrf_tokens WHERE id = ?");
            $stmt->execute([$result['id']]);
            return true;
        }
        
        return false;
    } catch (Exception $e) {
        error_log("CSRF token validation error: " . $e->getMessage());
        return false;
    }
}

// Handle CSRF token requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    $token = generateCSRFToken($userId);
    
    if ($token) {
        echo json_encode(['success' => true, 'token' => $token]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to generate CSRF token']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>