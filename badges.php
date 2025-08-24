<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['user_id'])) {
            getUserBadges();
        } else {
            getAllBadges();
        }
        break;
}

function getUserBadges() {
    global $pdo;
    $userId = $_GET['user_id'];
    
    $stmt = $pdo->prepare("
        SELECT b.*, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to prepare statement']);
        return;
    }
    
    if (!$stmt->execute([$userId])) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to execute statement']);
        return;
    }

    $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($badges);
}

function getAllBadges() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM badges ORDER BY hours_required ASC");
    $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($badges);
}
?>