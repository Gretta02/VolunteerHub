<?php
// Strictly include only known, hardcoded files from the current directory
$configPath = __DIR__ . '/config.php';
$jwtPath = __DIR__ . '/jwt.php';

if (!file_exists($configPath) || !is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Config file missing or invalid']);
    exit;
}
if (!file_exists($jwtPath) || !is_file($jwtPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'JWT file missing or invalid']);
    exit;
}

require_once $configPath;
require_once $jwtPath;

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Rate limiting
session_start();
if (!isset($_SESSION['api_requests'])) {
    $_SESSION['api_requests'] = [];
}

$now = time();
$_SESSION['api_requests'] = array_filter($_SESSION['api_requests'], function($time) use ($now) {
    return $now - $time < 60; // Keep requests from last minute
});

if (count($_SESSION['api_requests']) > 100) { // Max 100 requests per minute
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}

$_SESSION['api_requests'][] = $now;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] == 'register') {
            registerForEvent();
        } else {
            createEvent();
        }
        break;
    case 'GET':
        getEvents();
        break;
    case 'DELETE':
        if (isset($_GET['action']) && $_GET['action'] == 'unregister') {
            unregisterFromEvent();
        } else {
            deleteEvent();
        }
        break;
}

function createEvent() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO events (title, category, date, time, location, description, requirements, max_volunteers, organizer_id, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['title'],
        $data['category'],
        $data['date'],
        $data['time'],
        $data['location'],
        $data['description'],
        $data['requirements'] ?? null,
        $data['maxVolunteers'],
        $data['organizerId'],
        $data['image'] ?? 'fas fa-calendar'
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Event created successfully', 'id' => $pdo->lastInsertId()]);
}

function getEvents() {
    global $pdo;
    
    // Get volunteers for a specific event
    if (isset($_GET['event_id']) && isset($_GET['action']) && $_GET['action'] == 'volunteers') {
        $sql = "SELECT u.id, u.name, u.email, u.phone, u.location 
                FROM users u 
                JOIN event_registrations er ON u.id = er.volunteer_id 
                WHERE er.event_id = ? AND u.role = 'volunteer'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$_GET['event_id']]);
        $volunteers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($volunteers);
        return;
    }
    
    // Get registered events for a specific volunteer
    if (isset($_GET['volunteer_id']) && isset($_GET['action']) && $_GET['action'] == 'registered') {
        $sql = "SELECT e.* FROM events e 
                JOIN event_registrations er ON e.id = er.event_id 
                WHERE er.volunteer_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$_GET['volunteer_id']]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($events);
        return;
    }
    
    $sql = "SELECT e.*, u.name as organizer, 
            (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as volunteers
            FROM events e 
            JOIN users u ON e.organizer_id = u.id";
    
    if (isset($_GET['organizer_id'])) {
        $sql .= " WHERE e.organizer_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$_GET['organizer_id']]);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($events);
}

function registerForEvent() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $eventId = filter_var($data['eventId'], FILTER_VALIDATE_INT);
    $volunteerId = filter_var($data['volunteerId'], FILTER_VALIDATE_INT);
    
    if (!$eventId || !$volunteerId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        return;
    }
    
    // Check if event exists
    $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ?");
    $stmt->execute([$data['eventId']]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Event not found']);
        return;
    }
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$data['volunteerId']]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO event_registrations (event_id, volunteer_id) VALUES (?, ?)");
        $stmt->execute([$data['eventId'], $data['volunteerId']]);
        
        echo json_encode(['success' => true, 'message' => 'Registered successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Already registered: ' . $e->getMessage()]);
    }
}

function unregisterFromEvent() {
    global $pdo;
    $eventId = $_GET['event_id'];
    $volunteerId = $_GET['volunteer_id'];
    
    $stmt = $pdo->prepare("DELETE FROM event_registrations WHERE event_id = ? AND volunteer_id = ?");
    $stmt->execute([$eventId, $volunteerId]);
    
    echo json_encode(['success' => true, 'message' => 'Unregistered successfully']);
}

function deleteEvent() {
    global $pdo;
    $eventId = $_GET['id'];
    
    $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmt->execute([$eventId]);
    
    echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
}
?>