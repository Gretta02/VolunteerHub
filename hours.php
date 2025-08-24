<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'POST':
        logHours();
        break;
    case 'GET':
        if (isset($_GET['user_id'])) {
            getUserHours();
        } else {
            getAllHours();
        }
        break;
    case 'PUT':
        approveHours();
        break;
}

function logHours() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO volunteer_hours (volunteer_id, event_id, hours_worked, date_worked) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $data['volunteerId'],
        $data['eventId'],
        $data['hours'],
        $data['date']
    ]);
    
    // Check for new badges
    checkBadges($data['volunteerId']);
    
    echo json_encode(['success' => true, 'message' => 'Hours logged successfully']);
}

function getUserHours() {
    global $pdo;
    $userId = $_GET['user_id'];
    
    $stmt = $pdo->prepare("
        SELECT vh.*, e.title as event_title
        FROM volunteer_hours vh
        JOIN events e ON vh.event_id = e.id
        WHERE vh.volunteer_id = ?
        ORDER BY vh.date_worked DESC
    ");
    
    $stmt->execute([$userId]);
    $hours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total approved hours
    $totalStmt = $pdo->prepare("SELECT SUM(hours_worked) as total FROM volunteer_hours WHERE volunteer_id = ? AND status = 'approved'");
    $totalStmt->execute([$userId]);
    $total = $totalStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get user badges with progress
    $badgesStmt = $pdo->prepare("
        SELECT b.*, ub.earned_at,
               CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as earned
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
        ORDER BY b.hours_required ASC
    ");
    $badgesStmt->execute([$userId]);
    $badges = $badgesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $totalHours = $total['total'] ?? 0;
    
    // Add progress to badges
    foreach ($badges as &$badge) {
        if (!$badge['earned']) {
            $remaining = max(0, $badge['hours_required'] - $totalHours);
            $badge['hours_remaining'] = $remaining;
        }
    }
    
    echo json_encode([
        'hours' => $hours,
        'totalHours' => $totalHours,
        'badges' => $badges
    ]);
}

function approveHours() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("UPDATE volunteer_hours SET status = 'approved' WHERE id = ?");
    $stmt->execute([$data['hoursId']]);
    
    // Check for new badges after approval
    $hoursStmt = $pdo->prepare("SELECT volunteer_id FROM volunteer_hours WHERE id = ?");
    $hoursStmt->execute([$data['hoursId']]);
    $volunteer = $hoursStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($volunteer) {
        checkBadges($volunteer['volunteer_id']);
    }
    
    echo json_encode(['success' => true, 'message' => 'Hours approved successfully']);
}

function checkBadges($userId) {
    global $pdo;
    
    // Get total approved hours
    $stmt = $pdo->prepare("SELECT SUM(hours_worked) as total FROM volunteer_hours WHERE volunteer_id = ? AND status = 'approved'");
    $stmt->execute([$userId]);
    $totalHours = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // Get available badges
    $badgesStmt = $pdo->query("SELECT * FROM badges WHERE hours_required <= $totalHours");
    $availableBadges = $badgesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Award new badges
    foreach ($availableBadges as $badge) {
        try {
            $awardStmt = $pdo->prepare("INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)");
            $awardStmt->execute([$userId, $badge['id']]);
        } catch (PDOException $e) {
            // Badge already awarded
        }
    }
}

// Get all volunteer hours (admin or general listing)
function getAllHours() {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT vh.*, e.title as event_title, u.name as volunteer_name
        FROM volunteer_hours vh
        JOIN events e ON vh.event_id = e.id
        JOIN users u ON vh.volunteer_id = u.id
        ORDER BY vh.date_worked DESC
    ");
    $stmt->execute();
    $hours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['hours' => $hours]);
}
?>