USE library_db;

-- 1. เพิ่มรหัสผ่านและอัปเดตประเภท
ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT '123456';
ALTER TABLE users MODIFY COLUMN type ENUM('student', 'staff', 'public', 'admin') NOT NULL;

-- 2. เพิ่มข้อมูลระดับ Admin เป็นตัวอย่าง
INSERT IGNORE INTO users (id, name, type, email, password) VALUES (999, 'Super Admin', 'admin', 'admin@admin.com', 'admin123');

-- 3. อัปเดต View ถอดรวม user_id มาด้วยเพื่อใช้ Query ย่อย
DROP VIEW IF EXISTS vw_TransactionDetails;
CREATE VIEW vw_TransactionDetails AS
SELECT 
    t.id as transaction_id,
    t.user_id,
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

-- 4. รันระบบการดึงจัดซื้อมาเป็นหนังสือของหอสมุด
DELIMITER //
DROP PROCEDURE IF EXISTS sp_ApproveRequest //
CREATE PROCEDURE sp_ApproveRequest(IN p_request_id INT, IN p_barcode_rfid VARCHAR(50), IN p_author VARCHAR(255))
BEGIN
    DECLARE v_title VARCHAR(255);
    DECLARE v_status VARCHAR(20);
    
    SELECT title, status INTO v_title, v_status FROM book_requests WHERE id = p_request_id;
    
    IF v_title IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request not found';
    ELSEIF v_status = 'completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request already approved/completed';
    ELSE
        INSERT INTO books (title, author, barcode_rfid, status) VALUES (v_title, p_author, p_barcode_rfid, 'available');
        UPDATE book_requests SET status = 'completed' WHERE id = p_request_id;
    END IF;
END //
DELIMITER ;
