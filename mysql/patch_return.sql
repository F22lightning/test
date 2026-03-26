DELIMITER //
DROP PROCEDURE IF EXISTS sp_ReturnBook //
CREATE PROCEDURE sp_ReturnBook(IN p_barcode_rfid VARCHAR(50), IN p_fine_rate DECIMAL(10,2))
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
        
        -- ถ้าคืนช้ากว่ากำหนด ให้นำจำนวนวันคูณอัตราค่าปรับ (พารามิเตอร์ส่งมาจาก Node.js)
        IF v_days_overdue > 0 THEN
            SET v_fine_calculated = v_days_overdue * p_fine_rate;
        END IF;
        
        -- อัปเดตปิดบิล ใส่เวลาที่คืน และยอดค่าปรับ
        UPDATE transactions 
        SET return_date = NOW(), status = 'completed', fine_amount = v_fine_calculated
        WHERE id = v_transaction_id;
        
        -- คืนสภาพหนังสือ กลับขึ้นตะกร้าให้พร้อมยืม
    END IF;
END //
DELIMITER ;
