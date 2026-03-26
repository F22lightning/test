// นำเข้าไลบรารีต่าง ๆ ที่จำเป็นสำหรับการทำงานของ Backend
const express = require('express'); // ใช้ Express.js เป็นเฟรมเวิร์คหลักในการทำ Web Server และสร้าง API
const cors = require('cors'); // ใช้ CORS เพื่ออนุญาตให้หน้าเว็บ (Frontend) ต่างโดเมนหรือพอร์ตเรียกใช้ API ของเราได้
const bodyParser = require('body-parser'); // ใช้สำหรับแปลง (Parse) ข้อมูลที่ส่งมาในรูปแบบ JSON ให้อยู่ในรูป Object ของ JavaScript
const mysql = require('mysql2'); // ใช้ไลบรารี mysql2 เพื่อเชื่อมต่อและจัดการฐานข้อมูล MySQL
const path = require('path'); // ใช้ไลบรารี path สำหรับจัดการเส้นทางไฟล์ (File Paths) ในระบบปฏิบัติการ
const dotenv = require('dotenv'); // ใช้โหลดตัวแปรสภาพแวดล้อม (Environment Variables) จากไฟล์ .env
const bcrypt = require('bcrypt'); // ใช้สำหรับเข้ารหัส (Hash) และตรวจสอบรหัสผ่าน (Password) เพื่อความปลอดภัย

dotenv.config(); // สั่งให้ dotenv โหลดค่าจากไฟล์ .env เข้าสู่ process.env ของ Node.js เพื่อให้พร้อมใช้งาน

const app = express(); // สร้าง Instance ของแอปพลิเคชัน Express
app.use(cors()); // เปิดใช้งาน CORS middleware เพื่อแก้ปัญหา Cross-Origin
app.use(bodyParser.json()); // เปิดให้แอปพลิเคชันสามารถรองรับและอ่านข้อมูลที่ส่งมาในรูปแบบ JSON ได้

// ระบุโฟลเดอร์สำหรับให้บริการไฟล์สแตติก (Static Files เช่น HTML, CSS, JS ของเครื่องหน้าบ้าน) 
// โดยให้โฟลเดอร์ '../frontend' ชี้ไปที่โฟลเดอร์ frontend ของโปรเจกต์
app.use(express.static(path.join(__dirname, '../frontend')));

// สร้างตัวเชื่อมต่อฐานข้อมูล (Connection Pool) เพื่อรองรับการเรียกใช้พร้อมกันหลาย ๆ Request ควบคู่กันไป
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // ที่อยู่ของฐานข้อมูล (ค่าเริ่มต้นเป็น localhost)
  user: process.env.DB_USER || 'root', // ชื่อผู้ใช้งานฐานข้อมูล
  password: process.env.DB_PASSWORD || 'root', // รหัสผ่านของฐานข้อมูล
  database: process.env.DB_NAME || 'library_db', // ชื่อก้อนฐานข้อมูลที่ต้องการเชื่อมต่อ
  port: process.env.DB_PORT || 3307, // พอร์ตที่เปิดให้เชื่อมต่อ (ใช้ 3307 ของ Docker)
  // Options เหล่านี้ช่วยรอจับคิวรี่เมื่อ Connection ว่าง เพื่อไม่ต้องสร้างการเชื่อมต่อใหม่ทุกครั้ง
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// เปลี่ยน Pool เป็นแบบรองรับ Promise (async/await) เพื่อให้โค้ดดูสะอาดและจัดการโครงสร้างได้ง่ายขึ้น
const promisePool = pool.promise();

/* ========================================================================= */
/* ==================== ส่วนจัดการและควบคุมสมุด (Books) ======================== */
/* ========================================================================= */

// API 1: โหลดรายชื่อหนังสือทั้งหมด (ใช้ตอนผู้ดูแลระบบ หรือผู้ใช้งานต้องการดูคอลเลคชั่น)
app.get('/api/books', async (req, res) => {
  try {
    // SELECT ข้อมูลทุกคอลัมน์จากตาราง books 
    const [rows] = await promisePool.query('SELECT * FROM books');
    res.json(rows); // ส่งผลลัพธ์ที่ได้กลับไปในรูปแบบ JSON ให้ Frontend นำไปวาดตาราง
  } catch (error) {
    res.status(500).json({ error: error.message }); // หากเกิดข้อผิดพลาด จะส่ง HTTP Status 500 (Server Error)
  }
});

// API 2: ลบหนังสือออกจากระบบ (ระบุ ID ผ่าน Parameter :id)
app.delete('/api/books/:id', async (req, res) => {
  try {
    // ลบข้อมูลอ้างอิงของหนังสือที่ตรงกับ id
    await promisePool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' }); // แจ้งผลตอบกลับเมื่อลบสำเร็จ
  } catch (error) {
    res.status(500).json({ error: error.message }); // แจ้งปัญหา หากลบไม่ได้ (เช่น หนังสือรหัสนี้กำลังติดค้างอยู่ในประวัติคนยืม)
  }
});

/* ========================================================================= */
/* ================= ส่วนจัดการผู้ใช้งานและการยืนยันตัวตน (Authentication) ========= */
/* ========================================================================= */

// API 3: ยืนยันสิทธิ์เข้าสู่ระบบ (Login)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body; // รับค่า Email และ Password จากฟอร์ม
  try {
    // ค้นหารายละเอียดไอดี อีเมล และรหัสผ่านที่เข้ารหัสไว้ (Hash) จากผู้ที่มีอีเมลตรงกัน
    const [rows] = await promisePool.query('SELECT id, name, type, email, password FROM users WHERE email = ?', [email]);
    if (rows.length > 0) { // หากพบข้อมูล
      const user = rows[0]; // ดึงข้อมูลของ User คนแรกมาใส่บรรทัดตัวแปร
      // สั่งเปรียบเทียบรหัสผ่าน (Compare) ที่กรอกมา กับ รหัสผ่านคริปโตที่ Hash ไว้ในฐานข้อมูล
      const match = await bcrypt.compare(password, user.password);
      if (match) { // ถ้ารหัสผ่านเข้าคู่กันได้ถูกต้อง
        delete user.password; // ลบคุณสมบัติรหัสผ่านทิ้งออกจาก Object ป้องกันข้อมูลรั่วไหลก่อนส่งให้บราวเซอร์
        res.json(user); // โยนเฉพาะชื่อ บทบาท อีเมล กลับไปให้ลูกข่ายใช้ต่อ
      } else {
        res.status(401).json({ error: 'Invalid email or password' }); // ถ้ารหัสผ่านผิด ส่ง 401 Unauthorized
      }
    } else {
      res.status(401).json({ error: 'Invalid email or password' }); // หากค้นหาอีเมลไม่เจอ ส่ง 401 Unauthorized ขากลับ
    }
  } catch (error) {
    res.status(500).json({ error: error.message }); // แจ้งข้อผิดพลาดฝั่ง Database
  }
});

// API 4: ดึงรายชื่อผู้ใช้ทั้งหมดลงรายงาน (Admin ดูอย่างเดียว)
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM users'); // เอาลิสรายการ Members ทั้งหมด
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 5: เพิ่มผู้ใช้งานรายใหม่เข้าระบบ
app.post('/api/users', async (req, res) => {
  const { name, type, email, password } = req.body; // ดึงชื่อ, บทบาทสิทธิ์ (type), เมล, และรหัส จากหน้าเว็บ
  try {
    const rawPass = password || '123456'; // หากตอนสมัครไม่ได้กรอกพาสเวิร์ดมา จะตั้งค่า Default เป็น 123456 ให้
    const hashed = await bcrypt.hash(rawPass, 10); // นำรหัสตั้งต้นไปปั่นเป็น Hash ชนิดซับซ้อน (ระดับ Salt rounds: 10)
    
    // ยิงเพิ่มเรคคอร์ดข้อมูลสู่ฐานข้อมูล พร้อมใส่พาสเวิร์ดที่แปลงรหัสเป็น Hash แล้ว
    await promisePool.query('INSERT INTO users (name, type, email, password) VALUES (?, ?, ?, ?)', [name, type, email, hashed]);
    res.json({ message: 'User added successfully' }); // แจ้ง Frontend ทราบว่าเสร็จสิ้นแล้ว
  } catch (error) {
    res.status(400).json({ error: error.sqlMessage || error.message }); // แจ้ง Error ของ SQL กลับ กรณีอีเมลซ้ำ (UNIQUE constraint)
  }
});

/* ========================================================================= */
/* ================== ส่วนระบบยืม-คืน อัตโนมัติ (Transactions) ================== */
/* ========================================================================= */

// API 6: ฟังก์ชันยืมหนังสือ (ทำงานโดยใช้ Stored Procedure: sp_BorrowBook)
app.post('/api/borrow', async (req, res) => {
  const { user_id, barcode_rfid, borrow_type } = req.body; // ดึงรหัสพนักงาน/นักศึกษา รหัสสินค้า และรูปแบบรับสินค้า
  try {
    // เรียกคำสั่ง CALL เพื่อรันโปรแกรมย่อยในชั้นของ MySQL โดยตรง (ป้องกันปัญหาข้อมูลหลุดค้าง)
    await promisePool.query('CALL sp_BorrowBook(?, ?, ?)', [user_id, barcode_rfid, borrow_type]);
    res.json({ message: 'Book borrowed successfully' }); // ถ้า SP ไม่ตีกลับบัค (Signal) แสดงว่ายืมเสร็จ
  } catch (error) {
    // 400 Bad Request ถ้าหนังสือหาย หรือสถานะไม่ว่าง (SP ยิง Signal กลับมา)
    res.status(400).json({ error: error.sqlMessage || error.message });
  }
});

// API 7: ฟังก์ชันคืนหนังสือ และตัดบัญชีเงินค่าปรับ (ใช้ Stored Procedure: sp_ReturnBook)
app.post('/api/return', async (req, res) => {
  const { barcode_rfid } = req.body; // สแกนแค่รหัสหนังสือตอนคืน ไม่ต้องใช้รหัสคน
  try {
    // ยิงคำสั่งเข้า SP ของการคืนหนังสือ โดยข้างใน MySQL จะหาบิลยืมค้างและคำนวณวันปรับอัตโนมัติ
    await promisePool.query('CALL sp_ReturnBook(?)', [barcode_rfid]);
    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    res.status(400).json({ error: error.sqlMessage || error.message });
  }
});

// API 8: ดึงข้อมูลสรุปรายงานรายวัน สำหรับหน้า Dashboard (อ้างอิงจาก Database View: vw_DailyReport)
app.get('/api/reports/daily', async (req, res) => {
  try {
    // เข้าถึง View ตัวช่วยที่รวบรวมกลุ่มข้อมูล (GROUP BY) มาให้เรียบร้อยแล้ว
    const [rows] = await promisePool.query('SELECT * FROM vw_DailyReport ORDER BY report_date ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 9: ดึงรายการประวัติและธุรกรรมล่าสุดทั้งหมด (Transactions)
app.get('/api/transactions', async (req, res) => {
  const { user_id } = req.query; // รับรหัส Param (GET) เผื่อในกรณีนักศึกษาขอเรียกดูประวัติของตัวเองเท่านั้น
  try {
    // ดึงหน้าต่าง View (vw_TransactionDetails) ที่ควบรวมตาราง User, Books, Transactions ทุกอย่างพร้อมเสร็จสรรพ
    let q = 'SELECT * FROM vw_TransactionDetails'; 
    let p = [];
    if(user_id) { 
      q += ' WHERE user_id = ?'; // หากมี User ID ต้องทำการระบุเงื่อนไขกรองเอาเฉพาะข้อมูลตนเอง
      p.push(user_id); 
    }
    q += ' ORDER BY borrow_date DESC'; // จัดเรียงลำดับจากล่าสุดไปเก่าสุด
    const [rows] = await promisePool.query(q, p);
    res.json(rows); // โยนประวัติกลับเป็น JSON Array
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ========================================================================= */
/* ================== ส่วนระบบจัดหา / แนะนำทรัพยากร (Procurement) ================== */
/* ========================================================================= */

// API 10: ดึงรายการคำร้องสั่งซื้อหนังสือ 
app.get('/api/requests', async (req, res) => {
  const { user_id } = req.query; // กรองด้วย user_id เช่นเดียวกันกรณีไม่ใช่ Admin
  try {
    // ใช้คำสั่ง JOIN ธรรมดา หาชื่อเรื่องและดึงชื่อผู้แนะนำหนังสือ (requester) ด้วย ID ที่ตรงกัน
    let q = `SELECT r.id, r.title, r.status, r.request_date, u.name as requester FROM book_requests r JOIN users u ON r.suggested_by = u.id`;
    let p = [];
    if(user_id) { 
      q += ' WHERE r.suggested_by = ?'; 
      p.push(user_id); 
    }
    q += ' ORDER BY r.request_date DESC'; // จัดเรียงล่าสุดขึ้นก่อน
    const [rows] = await promisePool.query(q, p);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 11: การตั้งค่าผู้ดูแล(Admin) ปฏิเสธการอนุมัติคำร้องหนังสือ 
app.post('/api/requests/reject', async (req, res) => {
  const { request_id } = req.body; // รับหมายเลขคำขอ
  try {
    // ปรับเปลี่ยนสถานะเอกสารคำขอเป็น "rejected" แทน (ใช้คำสั่ง UPDATE ตรงๆ)
    await promisePool.query('UPDATE book_requests SET status = "rejected" WHERE id = ?', [request_id]);
    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 12: การตั้งค่าผู้ดูแล(Admin) ยืนยันคำสั่งซื้อหนังสือ (ใช้ Stored Procedure: sp_ApproveRequest)
app.post('/api/requests/approve', async (req, res) => {
  const { request_id, barcode_rfid, author } = req.body; // รับเลขคำขอ พร้อมกับรหัสหนังสือจริงที่ซื้อมาแล้ว 
  try {
    // ยิงโปรแกรมย่อย SP ให้เปลี่ยนสถานะคำสั่งซื้อเป็นเสร็จสิ้น พ่วงกับย้ายหนังสือนั้นเข้าสู่คลังห้องสมุดเพื่อพร้อมทำงาน
    await promisePool.query('CALL sp_ApproveRequest(?, ?, ?)', [request_id, barcode_rfid, author || 'Unknown']);
    res.json({ message: 'Request approved and added to books' });
  } catch (error) {
    res.status(400).json({ error: error.sqlMessage || error.message }); // แจ้งกลับกรณีผิดพลาดจาก SP
  }
});

// API 13: ส่งคำร้องเสนอหนังสือใหม่
app.post('/api/requests', async (req, res) => {
  const { title, user_id } = req.body; // รับชื่อหนังสือที่อยากได้ และไอดีคนส่ง
  try {
    // ส่งข้อมูลลงไปสร้าง Request ใหม่เพื่อเข้าตารางให้แอดมินพิจารณา
    await promisePool.query('INSERT INTO book_requests (title, suggested_by) VALUES (?, ?)', [title, user_id]);
    res.json({ message: 'Book request generated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.sqlMessage || error.message });
  }
});

// API 14: ลบรายการคำขอจัดซื้อคอมพลีทออกจากประวัติ
app.delete('/api/requests/:id', async (req, res) => {
  try {
    await promisePool.query('DELETE FROM book_requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 15: ลบประวัติการทำรายการ (เฉพาะแอดมิน)
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await promisePool.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ========================================================================= */
/* ========================== ฝั่งส่งออกไฟล์เริ่มต้น (Serving)  ======================== */
/* ========================================================================= */

// รองรับเส้นทางที่เหลือทั้งหมด (Catch-all route) 
// หากไม่ได้เรียกใช้ API เราจะส่งไฟล์ index.html ของหน้าบ้านกลับไปเสมอ (ทำงานเหมือน SPA - Single Page App)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// เปิดรัน Web Server และระบุเบาะแสพอร์ต (ตามไฟล์ .env ถ้าไม่มีใช้ 3000 เป็นตัวตั้ง)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); // พิมพ์ Log ตอนสคริปต์ทำงานขึ้นสำเร็จ
});
