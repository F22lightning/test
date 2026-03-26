DROP PROCEDURE IF EXISTS sp_BorrowBook;
DELIMITER //
CREATE PROCEDURE sp_BorrowBook(IN p_user_id INT, IN p_barcode VARCHAR(50), IN p_borrow_type VARCHAR(20))
BEGIN
    DECLARE v_book_id INT;
    DECLARE v_status ENUM('available', 'borrowed', 'lost');
    DECLARE v_overdue_count INT;
    
    START TRANSACTION;
    
    -- Locking row to prevent concurrent borrowing (Data Conflict)
    SELECT id, status INTO v_book_id, v_status
    FROM books WHERE barcode_rfid = p_barcode FOR UPDATE;
    
    IF v_book_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found';
    END IF;
    
    IF v_status != 'available' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book is currently not available';
    END IF;
    
    -- Validation for Delivery: no overdue/unpaid allowed
    IF p_borrow_type = 'delivery' THEN
        SELECT COUNT(*) INTO v_overdue_count FROM transactions 
        WHERE user_id = p_user_id AND return_date IS NULL AND due_date < CURRENT_DATE;
        
        IF v_overdue_count > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot use Delivery: You have unpaid fines or overdue books.';
        END IF;
    END IF;
    
    INSERT INTO transactions (book_id, user_id, borrow_date, due_date, type)
    VALUES (v_book_id, p_user_id, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), p_borrow_type);
    
    UPDATE books SET status = 'borrowed' WHERE id = v_book_id;
    
    COMMIT;
END //
DELIMITER ;
