-- สร้างฐานข้อมูล library_db หากยังไม่มีอยู่
CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- 1. ตาราง users: เก็บข้อมูลผู้ใช้งานระบบ (นักศึกษา, บุคลากร, บุคคลทั่วไป)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, -- รหัสผู้ใช้ (รันอัตโนมัติ)
    name VARCHAR(100) NOT NULL, -- ชื่อ-นามสกุล
    type ENUM('student', 'staff', 'public') NOT NULL, -- ประเภทผู้ใช้งาน
    email VARCHAR(100) UNIQUE, -- อีเมลสำหรับล็อกอิน (ห้ามซ้ำ)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- วันที่สร้างบัญชี
);

-- 2. ตาราง books: เก็บข้อมูลทรัพยากร/หนังสือในหอสมุด
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY, -- ไอดีหนังสือ
    title VARCHAR(255) NOT NULL, -- ชื่อเรื่อง
    author VARCHAR(255), -- ชื่อผู้แต่ง
    barcode_rfid VARCHAR(50) UNIQUE NOT NULL, -- รหัสบาร์โค้ด หรือ RFID ประจำเล่ม (ห้ามซ้ำ)
    status ENUM('available', 'borrowed', 'lost', 'maintenance') DEFAULT 'available', -- สถานะปัจจุบันของหนังสือ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- วันที่เพิ่มเข้าคลัง
);

-- 3. ตาราง book_requests: เก็บข้อมูลคำร้องขอให้ซื้อหนังสือใหม่
CREATE TABLE IF NOT EXISTS book_requests (
    id INT AUTO_INCREMENT PRIMARY KEY, -- รหัสคำร้อง
    title VARCHAR(255) NOT NULL, -- ชื่อหนังสือที่ต้องการให้ห้องสมุดจัดซื้อ
    suggested_by INT, -- รหัสคนที่เสนอ (เชื่อมโยงผู้ใช้)
    status ENUM('pending', 'ordered', 'rejected', 'completed') DEFAULT 'pending', -- สถานะคำร้อง
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- วันที่กรอกคำร้อง
    FOREIGN KEY(suggested_by) REFERENCES users(id) ON DELETE SET NULL -- หาผู้ใช้ไม่เจอ ให้เซ็ตเป็น NULL
);

-- 4. ตาราง transactions: เก็บประวัติการยืม-คืน และใบเสร็จค่าปรับ
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY, -- รหัสทำรายการ
    user_id INT, -- รหัสผู้ยืม
    book_id INT, -- หนังสือที่ถูกยืม
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- วันที่ยืมออกไป
    due_date DATETIME NOT NULL, -- กำหนดส่งคืน
    return_date DATETIME NULL, -- วันที่นำมาคืนจริง
    type ENUM('onsite', 'delivery') NOT NULL DEFAULT 'onsite', -- รูปแบบการรับหนังสือ
    fine_amount DECIMAL(10,2) DEFAULT 0.00, -- ค่าปรับ (บาท)
    waive_reason VARCHAR(255) DEFAULT NULL, -- เหตุผลที่ยกเว้นค่าปรับ
    status ENUM('active', 'completed') DEFAULT 'active', -- สถานะบิลนี้เคลียร์หรือยัง
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, -- ผู้ใช้ถูกลบ บิลลบตาม
    FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE -- หนังสือหาย บิลลบตาม (เพื่อความสะอาด)
);

DELIMITER //

-- DROP PROCEDURE IF EXISTS เพื่อให้ Docker รันสคริปต์ซ้ำได้ไม่ Error
DROP PROCEDURE IF EXISTS sp_BorrowBook //

-- ฟังก์ชัน Stored Procedure: ดำเนินการยืมหนังสือ
CREATE PROCEDURE sp_BorrowBook(IN p_user_id INT, IN p_barcode_rfid VARCHAR(50), IN p_borrow_type ENUM('onsite', 'delivery'))
BEGIN
    DECLARE v_book_id INT; -- ตัวแปรเก็บเล่มที่ค้นพบ
    DECLARE v_status VARCHAR(20); -- ตัวแปรเก็บสถานะหนังสือ
    DECLARE v_overdue_count INT; -- ตัวแปรนับจำนวนหนังสือบังคับส่ง
    
    -- Transaction Isolation and Locking (For Update)
    -- ป้องกันปัญหา Race Condition กรณีสแกนบาร์โค้ดพร้อมกัน 2 เครื่อง
    START TRANSACTION;
    
    -- ค้นหาหนังสือและทำการล็อค Row (FOR UPDATE)
    SELECT id, status INTO v_book_id, v_status 
    FROM books WHERE barcode_rfid = p_barcode_rfid FOR UPDATE;
    
    -- ถ้าหาหนังสือรหัสนี้ไม่เจอ ให้ยกเลิกการกระทำและแจ้งเตือน
    IF v_book_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book (Barcode/RFID) not found';
    END IF;
    
    -- ถ้าหนังสือมีคนยืมไปแล้ว หรือไม่อยู่ในสถานะให้ยืมได้ ให้ยกเลิก
    IF v_status != 'available' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book is not available';
    END IF;
    
    -- ตรวจสอบเงื่อนไข (Validation): ถ้าเลือกบริการจัดส่ง (Delivery)
    IF p_borrow_type = 'delivery' THEN
        -- นับจำนวนหนังสือที่ผู้ใช้นี้ค้างส่งคืน (เลยกำหนด)
        SELECT COUNT(*) INTO v_overdue_count FROM transactions 
        WHERE user_id = p_user_id AND return_date IS NULL AND due_date < CURRENT_DATE;
        
        -- ถ้ามีหนังสือค้างส่งแม้แต่ชิ้นเดียว ไม่อนุญาตให้ใช้บริการ Delivery
        IF v_overdue_count > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot use Delivery: You have unpaid fines or overdue books.';
        END IF;
    END IF;
    
    -- อัปเดตสถานะหนังสือเป็น 'กำลังถูกยืม'
    UPDATE books SET status = 'borrowed' WHERE id = v_book_id;
    
    -- สร้างบิลรายการยืม กำหนดเวลาส่งคืนคือ 7 วันถัดไปนับจากวันนี้
    INSERT INTO transactions (user_id, book_id, due_date, type) 
    VALUES (p_user_id, v_book_id, DATE_ADD(NOW(), INTERVAL 7 DAY), p_borrow_type);
    
    -- ยืนยันการเปลี่ยนแปลงข้อมูล
    COMMIT;
END //

DROP PROCEDURE IF EXISTS sp_ReturnBook //

-- ฟังก์ชัน Stored Procedure: ดำเนินการส่งคืนหนังสือและคำนวณค่าปรับ
CREATE PROCEDURE sp_ReturnBook(IN p_barcode_rfid VARCHAR(50))
BEGIN
    DECLARE v_transaction_id INT;
    DECLARE v_book_id INT;
    DECLARE v_due_date DATETIME;
    DECLARE v_days_overdue INT;
    DECLARE v_fine_calculated DECIMAL(10,2) DEFAULT 0.00;
    
    -- ค้นหาหนังสือจากรหัสเทปบาร์โค้ด
    SELECT id INTO v_book_id FROM books WHERE barcode_rfid = p_barcode_rfid;
    
    IF v_book_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found';
    END IF;

    -- ค้นหาบิลทำรายการที่หนังสือเล่มนี้ถูกยืมไปล่าสุดและยังไม่ส่งคืน (Active)
    SELECT id, due_date INTO v_transaction_id, v_due_date
    FROM transactions 
    WHERE book_id = v_book_id AND status = 'active'
    ORDER BY borrow_date DESC LIMIT 1;
    
    -- ถ้าไม่เจอบิลยืม แปลว่าหนังสือน่าจะไม่ได้ถูกยืมอยู่
    IF v_transaction_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active borrow transaction found for this book';
    ELSE
        -- อัปเดตสถานะหนังสือกลับมาเป็น 'ว่าง'
        UPDATE books SET status = 'available' WHERE id = v_book_id;
        
        -- คำนวณวันที่เกินกำหนดเปรียบเทียบกับวันนี้
        SET v_days_overdue = DATEDIFF(NOW(), v_due_date);
        
        -- ถ้าคืนช้ากว่ากำหนด ให้นำจำนวนวันคูณอัตราค่าปรับ (วันละ 10 บาท)
        IF v_days_overdue > 0 THEN
            SET v_fine_calculated = v_days_overdue * 10;
        END IF;
        
        -- อัปเดตปิดบิล ใส่เวลาที่คืน และยอดค่าปรับ
        UPDATE transactions 
        SET return_date = NOW(), status = 'completed', fine_amount = v_fine_calculated 
        WHERE id = v_transaction_id;
    END IF;
END //

DELIMITER ;

-- มุมมองจำลอง (Database View) สำหรับรายงานบัญชีห้องสมุดในแต่ละวัน
DROP VIEW IF EXISTS vw_DailyReport;
CREATE VIEW vw_DailyReport AS
SELECT 
    DATE(t.borrow_date) as report_date, -- วันทำรายการ
    COUNT(t.id) as total_borrows, -- จำนวนที่ยืมทั้งหมด
    SUM(CASE WHEN t.status = 'completed' AND DATE(t.return_date) = DATE(t.borrow_date) THEN 1 ELSE 0 END) as total_returned_same_day, -- ยอดคืนตรงวัน
    SUM(t.fine_amount) as total_fines_collected, -- ภาษี/ค่าปรับรวม
    COUNT(DISTINCT t.user_id) as unique_users_borrowing -- จำนวนคนยืมแบบไม่ซ้ำหน้า
FROM transactions t
GROUP BY DATE(t.borrow_date);

-- มุมมองจำลอง (Database View) สำหรับดึงประวัติการทำรายการพร้อมเชื่อมตารางให้เสร็จสรรพ
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
    t.fine_amount,
    t.waive_reason
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN books b ON t.book_id = b.id;

-- ชุดข้อมูลเริ่มต้น (Mock Data / Seeders)
-- ใช้ IGNORE เพื่อไม่ให้เกิด Error หากรันไฟล์นี้ซ้ำ
INSERT IGNORE INTO users (id, name, type, email) VALUES 
(1, 'Somchai Student', 'student', 'somchai@edu.com'),
(2, 'Suda Staff', 'staff', 'suda@edu.com'),
(3, 'Mana Public', 'public', 'mana@public.com');

INSERT IGNORE INTO books (id, title, author, barcode_rfid) VALUES 
(1, 'The Art of Computer Programming', 'Donald Knuth', 'RF001'),
(2, 'Clean Code', 'Robert C. Martin', 'RF002'),
(3, 'Design Patterns', 'GoF', 'RF003');
