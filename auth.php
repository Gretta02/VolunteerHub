<?php
require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        $action = $_POST['action'] ?? json_decode(file_get_contents('php://input'), true)['action'] ?? '';
        switch($action) {
            case 'login':
                login();
                break;
            case 'register':
                register();
                break;
            case 'refresh':
                refreshToken();
                break;
            case 'logout':
                logout();
                break;
            case 'oauth_google':
                handleGoogleOAuth();
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        break;
    case 'GET':
        if (isset($_GET['verify_token'])) {
            verifyToken();
        }
        break;
}

function login() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email and password required']);
            return;
        }
        
        // Rate limiting check
        if (!checkRateLimit($data['email'])) {
            http_response_code(429);
            echo json_encode(['success' => false, 'message' => 'Too many login attempts. Try again later.']);
            return;
        }
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([filter_var($data['email'], FILTER_SANITIZE_EMAIL)]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($data['password'], $user['password'])) {
            // Clear failed attempts
            clearFailedAttempts($data['email']);
            
            // Generate tokens
            $accessToken = generateJWT($user['id'], $user['role'], 900); // 15 minutes
            $refreshToken = generateJWT($user['id'], $user['role'], 604800); // 7 days
            
            // Store refresh token
            storeRefreshToken($user['id'], $refreshToken);
            
            // Set secure cookies
            setSecureCookie('access_token', $accessToken, time() + 900);
            setSecureCookie('refresh_token', $refreshToken, time() + 604800);
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => htmlspecialchars($user['name']),
                    'email' => htmlspecialchars($user['email']),
                    'role' => $user['role']
                ],
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken
            ]);
        } else {
            recordFailedAttempt($data['email']);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        }
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Server error']);
    }
}

function register() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!validateRegistrationData($data)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid registration data']);
            return;
        }
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([filter_var($data['email'], FILTER_SANITIZE_EMAIL)]);
        
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already registered']);
            return;
        }
        
        // Hash password
        $hashedPassword = password_hash($data['password'], PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3
        ]);
        
        // Insert user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            htmlspecialchars($data['name']),
            filter_var($data['email'], FILTER_SANITIZE_EMAIL),
            $hashedPassword,
            $data['role'],
            htmlspecialchars($data['phone'] ?? ''),
            htmlspecialchars($data['location'] ?? '')
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // Generate tokens
        $accessToken = generateJWT($userId, $data['role'], 900);
        $refreshToken = generateJWT($userId, $data['role'], 604800);
        
        storeRefreshToken($userId, $refreshToken);
        setSecureCookie('access_token', $accessToken, time() + 900);
        setSecureCookie('refresh_token', $refreshToken, time() + 604800);
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $userId,
                'name' => htmlspecialchars($data['name']),
                'email' => filter_var($data['email'], FILTER_SANITIZE_EMAIL),
                'role' => $data['role']
            ],
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken
        ]);
        
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
}

function handleGoogleOAuth() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id_token'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID token required']);
            return;
        }
        
        // Verify Google ID token
        $userInfo = verifyGoogleToken($data['id_token']);
        
        if (!$userInfo) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid Google token']);
            return;
        }
        
        // Check if user exists or create new user
        $user = findOrCreateGoogleUser($userInfo);
        
        // Generate tokens
        $accessToken = generateJWT($user['id'], $user['role'], 900);
        $refreshToken = generateJWT($user['id'], $user['role'], 604800);
        
        storeRefreshToken($user['id'], $refreshToken);
        setSecureCookie('access_token', $accessToken, time() + 900);
        setSecureCookie('refresh_token', $refreshToken, time() + 604800);
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => htmlspecialchars($user['name']),
                'email' => htmlspecialchars($user['email']),
                'role' => $user['role']
            ],
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken
        ]);
        
    } catch (Exception $e) {
        error_log("OAuth error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'OAuth authentication failed']);
    }
}

function refreshToken() {
    try {
        $refreshToken = $_COOKIE['refresh_token'] ?? json_decode(file_get_contents('php://input'), true)['refresh_token'] ?? '';
        
        if (!$refreshToken) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Refresh token required']);
            return;
        }
        
        $payload = verifyJWT($refreshToken);
        
        if (!$payload || !isValidRefreshToken($payload['user_id'], $refreshToken)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid refresh token']);
            return;
        }
        
        // Generate new access token
        $newAccessToken = generateJWT($payload['user_id'], $payload['role'], 900);
        setSecureCookie('access_token', $newAccessToken, time() + 900);
        
        echo json_encode([
            'success' => true,
            'access_token' => $newAccessToken
        ]);
        
    } catch (Exception $e) {
        error_log("Token refresh error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Token refresh failed']);
    }
}

function logout() {
    try {
        $refreshToken = $_COOKIE['refresh_token'] ?? '';
        
        if ($refreshToken) {
            $payload = verifyJWT($refreshToken);
            if ($payload) {
                revokeRefreshToken($payload['user_id'], $refreshToken);
            }
        }
        
        // Clear cookies
        setSecureCookie('access_token', '', time() - 3600);
        setSecureCookie('refresh_token', '', time() - 3600);
        
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
        
    } catch (Exception $e) {
        error_log("Logout error: " . $e->getMessage());
        echo json_encode(['success' => true, 'message' => 'Logged out']);
    }
}

function verifyToken() {
    try {
        $token = $_GET['token'] ?? $_COOKIE['access_token'] ?? '';
        
        if (!$token) {
            http_response_code(401);
            echo json_encode(['valid' => false, 'message' => 'No token provided']);
            return;
        }
        
        $payload = verifyJWT($token);
        
        if ($payload) {
            echo json_encode(['valid' => true, 'user_id' => $payload['user_id'], 'role' => $payload['role']]);
        } else {
            http_response_code(401);
            echo json_encode(['valid' => false, 'message' => 'Invalid token']);
        }
        
    } catch (Exception $e) {
        error_log("Token verification error: " . $e->getMessage());
        http_response_code(401);
        echo json_encode(['valid' => false, 'message' => 'Token verification failed']);
    }
}

// Helper functions
function validateRegistrationData($data) {
    return isset($data['name'], $data['email'], $data['password'], $data['role']) &&
           filter_var($data['email'], FILTER_VALIDATE_EMAIL) &&
           strlen($data['password']) >= 8 &&
           in_array($data['role'], ['volunteer', 'organizer']) &&
           preg_match('/^[a-zA-Z\s]+$/', $data['name']);
}

function setSecureCookie($name, $value, $expire) {
    setcookie($name, $value, [
        'expires' => $expire,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
}

function checkRateLimit($email) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM login_attempts WHERE email = ? AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
    $stmt->execute([$email]);
    
    return $stmt->fetchColumn() < 5; // Max 5 attempts per 15 minutes
}

function recordFailedAttempt($email) {
    global $pdo;
    
    $stmt = $pdo->prepare("INSERT INTO login_attempts (email, attempt_time) VALUES (?, NOW())");
    $stmt->execute([$email]);
}

function clearFailedAttempts($email) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM login_attempts WHERE email = ?");
    $stmt->execute([$email]);
}

function verifyGoogleToken($idToken) {
    // In production, verify with Google's API
    // For demo, return mock data
    return [
        'email' => 'user@gmail.com',
        'name' => 'Google User',
        'sub' => 'google_' . uniqid()
    ];
}

function findOrCreateGoogleUser($userInfo) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$userInfo['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Create new user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, oauth_provider, oauth_id) VALUES (?, ?, ?, 'volunteer', 'google', ?)");
        $stmt->execute([
            $userInfo['name'],
            $userInfo['email'],
            password_hash(uniqid(), PASSWORD_DEFAULT), // Random password for OAuth users
            $userInfo['sub']
        ]);
        
        $user = [
            'id' => $pdo->lastInsertId(),
            'name' => $userInfo['name'],
            'email' => $userInfo['email'],
            'role' => 'volunteer'
        ];
    }
    
    return $user;
}
?>