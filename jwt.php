<?php
// JWT implementation for secure authentication

class JWT {
    private static $secret = 'your-super-secret-jwt-key-change-in-production';
    private static $algorithm = 'HS256';
    
    public static function encode($payload, $expiry = 3600) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    public static function decode($jwt) {
        $parts = explode('.', $jwt);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Header)), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
        
        if (!$header || !$payload) {
            return false;
        }
        
        // Verify signature
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
        $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
}

function generateJWT($userId, $role, $expiry = 3600) {
    return JWT::encode([
        'user_id' => $userId,
        'role' => $role,
        'jti' => uniqid() // JWT ID for token tracking
    ], $expiry);
}

function verifyJWT($token) {
    return JWT::decode($token);
}

function storeRefreshToken($userId, $token) {
    global $pdo;
    
    // Clean old tokens
    $stmt = $pdo->prepare("DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()");
    $stmt->execute([$userId]);
    
    // Store new token
    $stmt = $pdo->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))");
    $stmt->execute([$userId, hash('sha256', $token)]);
}

function isValidRefreshToken($userId, $token) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()");
    $stmt->execute([$userId, hash('sha256', $token)]);
    
    return $stmt->fetch() !== false;
}

function revokeRefreshToken($userId, $token) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?");
    $stmt->execute([$userId, hash('sha256', $token)]);
}

function requireAuth() {
    $token = $_COOKIE['access_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (strpos($token, 'Bearer ') === 0) {
        $token = substr($token, 7);
    }
    
    $payload = verifyJWT($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    return $payload;
}

function requireRole($requiredRole) {
    $payload = requireAuth();
    
    if ($payload['role'] !== $requiredRole) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    
    return $payload;
}
?>