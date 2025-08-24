-- Security enhancements for VolunteerHub database

-- Add authentication tables
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_token (user_id, token_hash),
    INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    INDEX idx_email_time (email, attempt_time),
    INDEX idx_ip_time (ip_address, attempt_time)
);

CREATE TABLE IF NOT EXISTS csrf_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id INT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Add OAuth support to users table
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50) NULL,
ADD COLUMN oauth_id VARCHAR(255) NULL,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_secret VARCHAR(255) NULL,
ADD COLUMN last_login TIMESTAMP NULL,
ADD COLUMN failed_login_attempts INT DEFAULT 0,
ADD COLUMN account_locked_until TIMESTAMP NULL,
ADD INDEX idx_oauth (oauth_provider, oauth_id),
ADD INDEX idx_email_verified (email_verified);

-- Add audit trail table
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_created (created_at)
);

-- Add security settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_name VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default security settings
INSERT INTO security_settings (setting_name, setting_value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)'),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)'),
('password_min_length', '8', 'Minimum password length'),
('require_password_complexity', 'true', 'Require uppercase, lowercase, number in passwords'),
('enable_two_factor', 'false', 'Enable two-factor authentication'),
('jwt_secret_rotation_days', '30', 'JWT secret rotation interval in days'),
('csrf_token_lifetime', '3600', 'CSRF token lifetime in seconds')
ON DUPLICATE KEY UPDATE 
setting_value = VALUES(setting_value),
updated_at = CURRENT_TIMESTAMP;

-- Add performance indexes
ALTER TABLE events 
ADD INDEX idx_date_category (date, category),
ADD INDEX idx_organizer_date (organizer_id, date),
ADD INDEX idx_location (location(50));

ALTER TABLE event_registrations 
ADD INDEX idx_volunteer_date (volunteer_id, registered_at),
ADD INDEX idx_event_date (event_id, registered_at);

ALTER TABLE messages 
ADD INDEX idx_conversation (from_user_id, to_user_id),
ADD INDEX idx_unread (to_user_id, is_read, sent_at),
ADD INDEX idx_sent_date (sent_at);

ALTER TABLE contacts 
ADD INDEX idx_submitted_date (submitted_at),
ADD INDEX idx_subject (subject);

-- Add data validation constraints
ALTER TABLE users 
ADD CONSTRAINT chk_email_format CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
ADD CONSTRAINT chk_role_valid CHECK (role IN ('volunteer', 'organizer')),
ADD CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone REGEXP '^[0-9+\-\s\(\)]{10,20}$');

ALTER TABLE events 
ADD CONSTRAINT chk_max_volunteers_positive CHECK (max_volunteers > 0),
ADD CONSTRAINT chk_event_date_future CHECK (date >= CURDATE());

-- Create views for security monitoring
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    'Failed Login Attempts (Last 24h)' as metric,
    COUNT(*) as value
FROM login_attempts 
WHERE attempt_time > DATE_SUB(NOW(), INTERVAL 24 HOUR) 
AND success = FALSE

UNION ALL

SELECT 
    'Successful Logins (Last 24h)' as metric,
    COUNT(*) as value
FROM login_attempts 
WHERE attempt_time > DATE_SUB(NOW(), INTERVAL 24 HOUR) 
AND success = TRUE

UNION ALL

SELECT 
    'Locked Accounts' as metric,
    COUNT(*) as value
FROM users 
WHERE account_locked_until > NOW()

UNION ALL

SELECT 
    'Active Sessions' as metric,
    COUNT(*) as value
FROM refresh_tokens 
WHERE expires_at > NOW();

-- Create stored procedures for security operations
DELIMITER //

CREATE PROCEDURE RecordLoginAttempt(
    IN p_email VARCHAR(100),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_success BOOLEAN
)
BEGIN
    INSERT INTO login_attempts (email, ip_address, user_agent, success)
    VALUES (p_email, p_ip_address, p_user_agent, p_success);
    
    -- Update user failed attempts counter
    IF NOT p_success THEN
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            account_locked_until = CASE 
                WHEN failed_login_attempts + 1 >= (SELECT setting_value FROM security_settings WHERE setting_name = 'max_login_attempts')
                THEN DATE_ADD(NOW(), INTERVAL (SELECT setting_value FROM security_settings WHERE setting_name = 'lockout_duration') SECOND)
                ELSE account_locked_until
            END
        WHERE email = p_email;
    ELSE
        UPDATE users 
        SET failed_login_attempts = 0,
            account_locked_until = NULL,
            last_login = NOW()
        WHERE email = p_email;
    END IF;
END //

CREATE PROCEDURE CleanupExpiredTokens()
BEGIN
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    DELETE FROM csrf_tokens WHERE expires_at < NOW();
    DELETE FROM login_attempts WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
END //

CREATE PROCEDURE AuditAction(
    IN p_user_id INT,
    IN p_action VARCHAR(100),
    IN p_table_name VARCHAR(50),
    IN p_record_id INT,
    IN p_old_values JSON,
    IN p_new_values JSON,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values, p_ip_address, p_user_agent);
END //

DELIMITER ;

-- Create triggers for audit logging
DELIMITER //

CREATE TRIGGER users_audit_insert 
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.id, 'INSERT', 'users', NEW.id, JSON_OBJECT(
        'name', NEW.name,
        'email', NEW.email,
        'role', NEW.role
    ));
END //

CREATE TRIGGER users_audit_update 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'users', NEW.id, 
        JSON_OBJECT('name', OLD.name, 'email', OLD.email, 'role', OLD.role),
        JSON_OBJECT('name', NEW.name, 'email', NEW.email, 'role', NEW.role)
    );
END //

CREATE TRIGGER events_audit_insert 
AFTER INSERT ON events
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.organizer_id, 'INSERT', 'events', NEW.id, JSON_OBJECT(
        'title', NEW.title,
        'category', NEW.category,
        'date', NEW.date,
        'location', NEW.location
    ));
END //

DELIMITER ;

-- Create event for automatic cleanup
CREATE EVENT IF NOT EXISTS cleanup_expired_data
ON SCHEDULE EVERY 1 HOUR
DO
  CALL CleanupExpiredTokens();

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;