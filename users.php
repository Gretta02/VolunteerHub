<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] == 'login') {
            login();
        } elseif (isset($_GET['action']) && $_GET['action'] == 'register') {
            register();
        } else {
            register();
        }
        break;
    case 'GET':
        getUsers();
        break;
    case 'PUT':
        updateUser();
        break;
}

function register() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, location, interests) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    try {
        $stmt->execute([
            $data['name'],
            $data['email'],
            $hashedPassword,
            $data['role'],
            $data['phone'] ?? null,
            $data['location'] ?? null,
            json_encode($data['interests'] ?? [])
        ]);
        
        $userId = $pdo->lastInsertId();
        $user = [
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'phone' => $data['phone'],
            'location' => $data['location'],
            'interests' => $data['interests'] ?? []
        ];
        
        echo json_encode(['success' => true, 'user' => $user]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
    }
}

function login() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
    $stmt->execute([$data['email'], $data['role']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($data['password'], $user['password'])) {
        unset($user['password']);
        $user['interests'] = json_decode($user['interests'] ?? '[]');
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
}

function getUsers() {
    global $pdo;
    $stmt = $pdo->query("SELECT id, name, email, role, phone, location, interests, join_date FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach($users as &$user) {
        $user['interests'] = json_decode($user['interests'] ?? '[]');
    }
    
    echo json_encode($users);
}

function updateUser() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, location = ?, interests = ? WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['phone'],
        $data['location'],
        json_encode($data['interests'] ?? []),
        $data['id']
    ]);
    
    echo json_encode(['success' => true, 'message' => 'User updated successfully']);
}
?>