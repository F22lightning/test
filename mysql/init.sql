CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('student', 'staff', 'public') NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    barcode_rfid VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('available', 'borrowed', 'lost', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    suggested_by INT,
    status ENUM('pending', 'ordered', 'rejected', 'completed') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(suggested_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    book_id INT,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME NULL,
    type ENUM('onsite', 'delivery') NOT NULL DEFAULT 'onsite',
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'completed') DEFAULT 'active',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

DELIMITER //

-- DROP PROCEDURE IF EXISTS as docker init might run over it
DROP PROCEDURE IF EXISTS sp_BorrowBook //
CREATE PROCEDURE sp_BorrowBook(IN p_user_id INT, IN p_barcode_rfid VARCHAR(50), IN p_borrow_type ENUM('onsite', 'delivery'))
BEGIN
    DECLARE v_book_id INT;
    DECLARE v_status VARCHAR(20);
    DECLARE v_overdue_count INT;
    
    -- Transaction Isolation and Locking (For Update)
    START TRANSACTION;
    
    SELECT id, status INTO v_book_id, v_status 
    FROM books WHERE barcode_rfid = p_barcode_rfid FOR UPDATE;
    
    IF v_book_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book (Barcode/RFID) not found';
    END IF;
    
    IF v_status != 'available' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book is not available';
    END IF;
    
    -- Sub-task: Prevent delivery if there are unreturned/overdue books
    IF p_borrow_type = 'delivery' THEN
        SELECT COUNT(*) INTO v_overdue_count FROM transactions 
        WHERE user_id = p_user_id AND return_date IS NULL AND due_date < CURRENT_DATE;
        
        IF v_overdue_count > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot use Delivery: You have unpaid fines or overdue books.';
        END IF;
    END IF;
    
    UPDATE books SET status = 'borrowed' WHERE id = v_book_id;
    INSERT INTO transactions (user_id, book_id, due_date, type) 
    VALUES (p_user_id, v_book_id, DATE_ADD(NOW(), INTERVAL 7 DAY), p_borrow_type);
    
    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_ReturnBook //
CREATE PROCEDURE sp_ReturnBook(IN p_barcode_rfid VARCHAR(50))
BEGIN
    DECLARE v_transaction_id INT;
    DECLARE v_book_id INT;
    DECLARE v_due_date DATETIME;
    DECLARE v_days_overdue INT;
    DECLARE v_fine_calculated DECIMAL(10,2) DEFAULT 0.00;
    
    SELECT id INTO v_book_id FROM books WHERE barcode_rfid = p_barcode_rfid;
    
    IF v_book_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found';
    END IF;

    SELECT id, due_date INTO v_transaction_id, v_due_date
    FROM transactions 
    WHERE book_id = v_book_id AND status = 'active'
    ORDER BY borrow_date DESC LIMIT 1;
    
    IF v_transaction_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active borrow transaction found for this book';
    ELSE
        UPDATE books SET status = 'available' WHERE id = v_book_id;
        
        SET v_days_overdue = DATEDIFF(NOW(), v_due_date);
        IF v_days_overdue > 0 THEN
            SET v_fine_calculated = v_days_overdue * 10;
        END IF;
        
        UPDATE transactions 
        SET return_date = NOW(), status = 'completed', fine_amount = v_fine_calculated 
        WHERE id = v_transaction_id;
    END IF;
END //

DELIMITER ;

DROP VIEW IF EXISTS vw_DailyReport;
CREATE VIEW vw_DailyReport AS
SELECT 
    DATE(t.borrow_date) as report_date,
    COUNT(t.id) as total_borrows,
    SUM(CASE WHEN t.status = 'completed' AND DATE(t.return_date) = DATE(t.borrow_date) THEN 1 ELSE 0 END) as total_returned_same_day,
    SUM(t.fine_amount) as total_fines_collected,
    (SELECT COUNT(DISTINCT user_id) FROM transactions WHERE DATE(borrow_date) = DATE(t.borrow_date)) as unique_users_borrowing
FROM transactions t
GROUP BY DATE(t.borrow_date);

DROP VIEW IF EXISTS vw_TransactionDetails;
CREATE VIEW vw_TransactionDetails AS
SELECT 
    t.id as transaction_id,
    u.name as user_name,
    u.type as user_type,
    b.title as book_title,
    b.barcode_rfid,
    t.borrow_date,
    t.due_date,
    t.return_date,
    t.type as delivery_type,
    t.status,
    t.fine_amount
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN books b ON t.book_id = b.id;

-- Insert Seed Data (Ignore duplicates)
INSERT IGNORE INTO users (id, name, type, email) VALUES 
(1, 'Somchai Student', 'student', 'somchai@edu.com'),
(2, 'Suda Staff', 'staff', 'suda@edu.com'),
(3, 'Mana Public', 'public', 'mana@public.com');

INSERT IGNORE INTO books (id, title, author, barcode_rfid) VALUES 
(1, 'The Art of Computer Programming', 'Donald Knuth', 'RF001'),
(2, 'Clean Code', 'Robert C. Martin', 'RF002'),
(3, 'Design Patterns', 'GoF', 'RF003');
