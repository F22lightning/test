-- เพิ่มคอลัมน์เก็บเหตุผลการยกเว้นค่าปรับ
ALTER TABLE transactions Add COLUMN waive_reason VARCHAR(255) DEFAULT NULL AFTER fine_amount;

-- อัปเดต View ให้ดึงฟิลด์นี้มาด้วย
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
