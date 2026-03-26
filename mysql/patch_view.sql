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
