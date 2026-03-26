DROP PROCEDURE IF EXISTS sp_BorrowBook;
DELIMITER //

-- ฟังก์ชัน Stored Procedure: ดำเนินการยืมหนังสือ (อัปเดตระบบล็อคเพื่อลดยอดการขัดแย้ง)
CREATE PROCEDURE sp_BorrowBook(IN p_user_id INT, IN p_barcode VARCHAR(50), IN p_borrow_type VARCHAR(20))
BEGIN
    DECLARE v_book_id INT;
    DECLARE v_status ENUM('available', 'borrowed', 'lost');
    DECLARE v_overdue_count INT;
    
    -- Transaction Isolation and Locking to prevent Data Conflict
    -- เริ่มกระบวนการทำรายการ และบล็อกแถวหนังสือเพื่อไม่ให้คนอื่นชนกันรบกวนจังหวะ
    START TRANSACTION;
    
    -- ล็อคหนังสือด้วย FOR UPDATE จนกว่ากระบวนการนี้จะ COMMIT เสร็จสิ้น
    SELECT id, status INTO v_book_id, v_status
    FROM books WHERE barcode_rfid = p_barcode FOR UPDATE;
    
    -- กรณีไม่พบหมายเลข RFID
    IF v_book_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book (Barcode/RFID) not found';
    END IF;
    
    -- กรณีหนังสือไม่อยู่สถานะพร้อมยืม (ไม่ได้เป็น available)
    IF v_status != 'available' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book is currently not available';
    END IF;
    
    -- ตรวจสอบคุณสมบัติก่อนใช้บริการ Delivery
    IF p_borrow_type = 'delivery' THEN
        -- นับหนังสือที่ยังไม่คืนและเลยกำหนด (โดนค่าปรับค้างชำระ)
        SELECT COUNT(*) INTO v_overdue_count FROM transactions 
        WHERE user_id = p_user_id AND return_date IS NULL AND due_date < CURRENT_DATE;
        
        -- ถ้ามีหนังสือคงค้างติดแบล็กลิสอยู่ จะทำการถีบออกคำสั่งทันที ป้องกันสิทธิ์
        IF v_overdue_count > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot use Delivery: You have unpaid fines or overdue books.';
        END IF;
    END IF;
    
    -- ส่งข้อมูลเข้าตารางสร้างบิลยืม กำหนดเวลาส่งคืนคือ 7 วันถัดไป
    INSERT INTO transactions (book_id, user_id, borrow_date, due_date, type)
    VALUES (v_book_id, p_user_id, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), p_borrow_type);
    
    -- เปลี่ยนแปลงแฟ้มหนังสือเป็นยืมออกไป
    UPDATE books SET status = 'borrowed' WHERE id = v_book_id;
    
    -- กดตกลงให้ฐานข้อมูลทำงานจริง ปลดล็อค Row
    COMMIT;
END //
DELIMITER ;
