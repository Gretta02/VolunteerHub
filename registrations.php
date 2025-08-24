<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['event_id'])) {
            getEventVolunteers();
        } else {
            getUserRegistrations();
        }
        break;
}

function getEventVolunteers() {
    global $pdo;
    $eventId = $_GET['event_id'];
    
    $stmt = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.phone, u.location, er.registered_at
        FROM event_registrations er
        JOIN users u ON er.volunteer_id = u.id
        WHERE er.event_id = ?
        ORDER BY er.registered_at DESC
    ");
    
    $stmt->execute([$eventId]);
    $volunteers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($volunteers);
}

function getUserRegistrations() {
    global $pdo;
    $userId = $_GET['user_id'] ?? null;
    $organizerId = $_GET['organizer_id'] ?? null;
    
    if ($organizerId) {
        // Get volunteers for organizer's events
        $stmt = $pdo->prepare("
            SELECT DISTINCT u.id, u.name, u.email, u.phone, u.location,
                   GROUP_CONCAT(e.title SEPARATOR ', ') as events
            FROM event_registrations er
            JOIN users u ON er.volunteer_id = u.id
            JOIN events e ON er.event_id = e.id
            WHERE e.organizer_id = ?
            GROUP BY u.id, u.name, u.email, u.phone, u.location
            ORDER BY u.name ASC
        ");
        
        $stmt->execute([$organizerId]);
        $volunteers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($volunteers);
        return;
    }
    
    if (!$userId) {
        echo json_encode([]);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT e.*, u.name as organizer,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as volunteers
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        JOIN users u ON e.organizer_id = u.id
        WHERE er.volunteer_id = ?
        ORDER BY e.date ASC
    ");
    
    $stmt->execute([$userId]);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($events);
}
?>