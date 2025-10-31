-- SQL script for university event & resource management system


-- Disable FK checks temporarily to avoid ordering issues
SET foreign_key_checks = 0;

-- Table 1: ROLES (No dependencies)
CREATE TABLE roles (
    role_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Table 2: CATEGORIES (No dependencies)
CREATE TABLE categories (
    category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- Table 3: VENUES (No dependencies)
CREATE TABLE venues (
    venue_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venue_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    capacity INT UNSIGNED NOT NULL CHECK (capacity > 0)
);

-- Table 4: EQUIPMENT (No dependencies)
CREATE TABLE equipment (
    equipment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Available', 'In Use', 'Under Maintenance'))
);

-- Table 5: CLUBS (No dependencies)
CREATE TABLE clubs (
    club_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    club_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Table 6: USERS (Depends on ROLES)
CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_pincode VARCHAR(20),
    role_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Table 7: USER_PHONE_NUMBERS
CREATE TABLE user_phone_numbers (
    user_id INT UNSIGNED NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, phone_number),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Table 8: EVENTS (Depends on CLUBS)
CREATE TABLE events (
    event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    club_id INT UNSIGNED NOT NULL,
    prerequisite_event_id INT UNSIGNED,
    FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE,
    CHECK (end_time > start_time)
);

ALTER TABLE events
ADD CONSTRAINT fk_prerequisite_event
FOREIGN KEY (prerequisite_event_id) REFERENCES events(event_id) ON DELETE SET NULL;

-- Table 9: BOOKINGS (Depends on EVENTS, VENUES, USERS)
CREATE TABLE bookings (
    booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id INT UNSIGNED NOT NULL,
    venue_id INT UNSIGNED NOT NULL,
    requested_by INT UNSIGNED,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Table 10: CLUB_MEMBERSHIPS
CREATE TABLE club_memberships (
    user_id INT UNSIGNED NOT NULL,
    club_id INT UNSIGNED NOT NULL,
    position VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, club_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(club_id) ON DELETE CASCADE
);

-- Table 11: EVENT_CATEGORIES
CREATE TABLE event_categories (
    event_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (event_id, category_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);

-- Table 12: ATTENDEES
CREATE TABLE attendees (
    user_id INT UNSIGNED NOT NULL,
    event_id INT UNSIGNED NOT NULL,
    rsvp_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- Table 13: BOOKING_EQUIPMENT
CREATE TABLE booking_equipment (
    booking_id INT UNSIGNED NOT NULL,
    equipment_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (booking_id, equipment_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE RESTRICT
);

-- Table 14: MAINTENANCE_LOGS
CREATE TABLE maintenance_logs (
    equipment_id INT UNSIGNED NOT NULL,
    log_date DATE NOT NULL,
    description TEXT NOT NULL,
    performed_by VARCHAR(255),
    PRIMARY KEY (equipment_id, log_date),
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE CASCADE
);

-- Enable FK checks back
SET foreign_key_checks = 1;


-- need a simple log table for one of the triggers to use.
CREATE TABLE audit_log (
    log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    log_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action_type VARCHAR(50),
    details TEXT
);

DELIMITER //

-- Functions

/**
 * Function: fn_GetAttendeeCount
 * Purpose: Returns the current number of registered attendees for a specific event.
 * Parameters: e_id (INT) - The ID of the event.
 * Returns: INT - The count of attendees.
 */
CREATE FUNCTION fn_GetAttendeeCount(e_id INT UNSIGNED)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE attendee_count INT;
    SELECT COUNT(*)
    INTO attendee_count
    FROM attendees
    WHERE event_id = e_id;
    RETURN attendee_count;
END //

/**
 * Function: fn_CheckVenueAvailability
 * Purpose: Checks if a venue is free during a specific time slot.
 * Used to prevent double-booking.
 * Parameters: v_id (INT) - The venue_id to check.
 * start_t (DATETIME) - The desired start time.
 * end_t (DATETIME) - The desired end time.
 * Returns: BOOLEAN - TRUE if available, FALSE if a conflict exists.
 */
CREATE FUNCTION fn_CheckVenueAvailability(
    v_id INT UNSIGNED,
    start_t DATETIME,
    end_t DATETIME
)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE conflict_count INT;
    
    -- Check for any 'Approved' bookings that overlap with the requested time
    -- Overlap logic: (NewStart < OldEnd) AND (NewEnd > OldStart)
    SELECT COUNT(*)
    INTO conflict_count
    FROM bookings b
    JOIN events e ON b.event_id = e.event_id
    WHERE b.venue_id = v_id
      AND b.status = 'Approved'
      AND (start_t < e.end_time AND end_t > e.start_time);
      
    RETURN (conflict_count = 0);
END //

-- Stored Procedures

/**
 * Procedure: sp_RegisterForEvent
 * Purpose: Registers a user for an event, with error handling.
 * Parameters: u_id (INT) - The user_id registering.
 * e_id (INT) - The event_id to register for.
 */
CREATE PROCEDURE sp_RegisterForEvent(IN u_id INT UNSIGNED, IN e_id INT UNSIGNED)
BEGIN
    -- Declare an exit handler for SQLSTATE 1062 (Duplicate entry for key)
    DECLARE EXIT HANDLER FOR 1062
    BEGIN
        SELECT 'Error: User is already registered for this event.' AS message;
    END;

    -- Attempt to insert the new attendee
    INSERT INTO attendees (user_id, event_id) VALUES (u_id, e_id);
    
    -- If successful
    SELECT 'Registration successful.' AS message;
END //

/**
 * Procedure: sp_ApproveBooking
 * Purpose: Approves a 'Pending' booking *if* the venue is available.
 * If not, it rejects the booking to prevent a conflict.
 * Parameters: b_id (INT) - The booking_id to approve.
 */
CREATE PROCEDURE sp_ApproveBooking(IN b_id INT UNSIGNED)
BEGIN
    DECLARE v_id INT;
    DECLARE e_start DATETIME;
    DECLARE e_end DATETIME;
    DECLARE is_available BOOLEAN;
    DECLARE current_status VARCHAR(50);

    SELECT b.status, b.venue_id, e.start_time, e.end_time
    INTO current_status, v_id, e_start, e_end
    FROM bookings b
    JOIN events e ON b.event_id = e.event_id
    WHERE b.booking_id = b_id;

    IF current_status = 'Pending' THEN
        -- Use our function to check for conflicts
        SET is_available = fn_CheckVenueAvailability(v_id, e_start, e_end);
        
        IF is_available THEN
            UPDATE bookings SET status = 'Approved' WHERE booking_id = b_id;
            SELECT 'Booking approved successfully.' AS message;
        ELSE
            UPDATE bookings SET status = 'Rejected' WHERE booking_id = b_id;
            SELECT 'Booking rejected: Venue conflict detected.' AS message;
        END IF;
    ELSE
        SELECT 'Booking is not in Pending status.' AS message;
    END IF;
END //


/**
 * Trigger: trg_LogUserCreation
 * Purpose: Logs a new entry in the audit_log table every time a user is created.
 * Event: AFTER INSERT on `users`
 */
CREATE TRIGGER trg_LogUserCreation
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action_type, details)
    VALUES ('NEW_USER', CONCAT('User created. ID: ', NEW.user_id, ', Email: ', NEW.email));
END //

/**
 * Trigger: trg_PreventSelfPrerequisite
 * Purpose: Prevents an event from being set as its own prerequisite.
 * Event: BEFORE UPDATE on `events` (cannot be BEFORE INSERT as ID is not set)
 */
CREATE TRIGGER trg_PreventSelfPrerequisite
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
    IF NEW.prerequisite_event_id = NEW.event_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'An event cannot be its own prerequisite.';
    END IF;
END //

/**
 * Trigger: trg_CheckEquipmentAvailability
 * Purpose: Prevents booking equipment that is not 'Available'.
 * Event: BEFORE INSERT on `booking_equipment`
 */
CREATE TRIGGER trg_CheckEquipmentAvailability
BEFORE INSERT ON booking_equipment
FOR EACH ROW
BEGIN
    DECLARE eq_status VARCHAR(50);
    
    SELECT status
    INTO eq_status
    FROM equipment
    WHERE equipment_id = NEW.equipment_id;
    
    IF eq_status != 'Available' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot book equipment: Item is not currently available.';
    END IF;
END //

DELIMITER ;
