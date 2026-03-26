/**
 * สคริปต์หลักสำหรับควบคุมการทำงานของหน้า Frontend (SPA - Single Page Application)
 * - ควบคุมระบบตรวจสอบสิทธิ์ผู้ใช้งาน (Authentication) & ซ่อน/แสดง UI ตามกฎ
 * - ควบคุมธีม (Dark/Light) และระบบสองภาษา (i18n)
 * - เรียกใช้และส่งข้อมูลผ่าน API ตามสิทธิ์ (Admin vs Member)
 */

/* 1. วัตถุเก็บคำศัพท์ (Dictionary) สำหรับแปลภาษา */
const translations = {
    // โหมดภาษาอังกฤษ (English)
    en: {
        app_title: "LibroAuto",
        nav_dashboard: "Dashboard",
        nav_self_service: "Self-Service",
        nav_books: "Books & Resources",
        nav_users: "Users & Members",
        nav_procurement: "Procurement",
        nav_transactions: "Transactions",
        dashboard_title: "Dashboard",
        dashboard_subtitle: "Overview & Daily Reports",
        recent_transactions: "Recent Transactions",
        col_id: "ID",
        col_user: "User",
        col_book: "Book",
        col_type: "Type",
        col_status: "Status",
        col_title: "Title",
        col_author: "Author",
        col_borrow_date: "Borrow Date",
        col_due_date: "Due Date",
        col_fine_amount: "Fine Amt.",
        col_suggested_by: "Suggested By",
        col_date: "Date",
        borrow_book: "Borrow Book",
        return_book: "Return Book",
        label_user_id: "User ID",
        label_rfid: "Book RFID / Barcode",
        label_delivery: "Delivery Type",
        opt_onsite: "On-site (At Library)",
        opt_delivery: "Online (Delivery)",
        btn_confirm_borrow: "Confirm Borrow",
        btn_confirm_return: "Confirm Return",
        library_resources: "Library Resources",
        suggest_book: "Suggest a Book",
        pending_requests: "Pending Requests",
        btn_submit_request: "Submit Request",
        all_transactions: "Transactions History",
        ph_user_id: "Ex. 1",
        ph_rfid: "Ex. RF001",
        ph_book_title: "Book Title",
        ph_your_user_id: "Your User ID",
        add_user: "Add New User",
        ph_user_name: "Name",
        ph_user_email: "Email",
        opt_student: "Student",
        opt_staff: "Staff",
        opt_public: "General Public",
        btn_add_user: "Add User",
        all_users: "Library Members",
        col_name: "Name",
        msg_add_user_success: "User added!",
        msg_borrow_success: "Borrow Successful!",
        msg_return_success: "Return Successful!",
        msg_req_success: "Request Submitted!",
        msg_req_approve: "Request Approved! Added to Books.",
        msg_book_deleted: "Book Deleted!",
        msg_req_reject: "Request Rejected!",
        msg_req_deleted: "Request Deleted!",
        msg_network_error: "Network Error! Please check server."
    },
    // โหมดภาษาไทย (Thai)
    th: {
        app_title: "ไลบรารีออโต้",
        nav_dashboard: "แผงควบคุมหลัก",
        nav_self_service: "บริการยืม-คืนอัตโนมัติ",
        nav_books: "หนังสือและทรัพยากร",
        nav_users: "จัดการผู้ใช้งาน",
        nav_procurement: "จัดหาและสั่งทำรายการ",
        nav_transactions: "ประวัติการทำรายการ",
        dashboard_title: "แผงควบคุมหลัก",
        dashboard_subtitle: "ภาพรวมและรายงานประจำวัน",
        recent_transactions: "รายการยืม-คืนล่าสุด",
        col_id: "รหัส",
        col_user: "ผู้ใช้",
        col_book: "หนังสือ",
        col_type: "ประเภท",
        col_status: "สถานะ",
        col_title: "ชื่อหนังสือ",
        col_author: "ผู้แต่ง",
        col_borrow_date: "วันที่ยืม",
        col_due_date: "กำหนดคืน",
        col_fine_amount: "ค่าปรับ",
        col_suggested_by: "ผู้เสนอแนะ",
        col_date: "วันที่ขอ",
        borrow_book: "ทำการยืมหนังสือ",
        return_book: "ส่งคืนหนังสือ",
        label_user_id: "รหัสผู้ใช้",
        label_rfid: "รหัสบาร์โค้ด / RFID",
        label_delivery: "รูปแบบช่องทางการรับ",
        opt_onsite: "รับที่หอสมุด (On-site)",
        opt_delivery: "ช่องทางจัดส่ง (Delivery)",
        btn_confirm_borrow: "ยืนยันการยืม",
        btn_confirm_return: "ยืนยันการส่งคืน",
        library_resources: "คลังสมบัติของหอสมุดทั้งหมด",
        suggest_book: "เสนอแนะจัดซื้อหนังสือใหม่",
        pending_requests: "รายการที่รอพิจารณาจัดซื้อ",
        btn_submit_request: "ส่งคำร้อง",
        all_transactions: "ประวัติทำรายการ",
        ph_user_id: "ตัวอย่าง: 1",
        ph_rfid: "ตัวอย่าง: RF001",
        ph_book_title: "ระบุชื่อหนังสือ",
        ph_your_user_id: "ใส่รหัสผู้ใช้งานของท่าน",
        add_user: "เพิ่มสมาชิกใหม่",
        ph_user_name: "ชื่อ-นามสกุล",
        ph_user_email: "อีเมล",
        opt_student: "นักศึกษา",
        opt_staff: "บุคลากร",
        opt_public: "บุคคลทั่วไป",
        btn_add_user: "ตกลงเพิ่ม",
        all_users: "สมาชิกหอสมุดทั้งหมด",
        col_name: "ชื่อ",
        msg_add_user_success: "เพิ่มสมาชิกใหม่ลงฐานข้อมูลสำเร็จ!",
        msg_borrow_success: "ทำการยืมหนังสือสำเร็จเรียบร้อย!",
        msg_return_success: "คืนหนังสือล้างข้อมูลสำเร็จ!",
        msg_req_success: "ระบบได้รับคำร้องการขอหนังสือแล้ว!",
        msg_req_approve: "อนุมัติจัดซื้อ นำเข้าสต็อคหนังสือเรียบร้อย!",
        msg_book_deleted: "ลบหนังสือออกจากระบบเรียบร้อย",
        msg_req_reject: "ปฏิเสธคำร้องจัดซื้อหนังสือสำเร็จ",
        msg_req_deleted: "ลบรายการคำร้องสำเร็จ!",
        msg_network_error: "การเชื่อมต่อขัดข้อง ไม่สามารถติดต่อฐานข้อมูลได้"
    }
};

/* ตัวแปรระบบเบื้องต้น */
let currentLang = localStorage.getItem('appLang') || 'en'; 
let authUser = null; 
let activeViewTarget = 'borrow-return'; 

/* รันโค้ดทันทีที่โหลดหน้าเสร็จ */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();       
    initLanguage();    
    initNavigation();  
    checkAuthentication(); // ตรวจสอบสถานะการ Login ทันที
});

/* ------------------------------------------------------------------------
 * 1. ระบบ Authentication (Login / Logout / Role Check)
 * ------------------------------------------------------------------------ */
function checkAuthentication() {
    const savedSession = localStorage.getItem('authUser');
    
    // ถ้าเคย Login ค้างไว้ ให้โหลดข้อมูลทันที
    if(savedSession) {
        authUser = JSON.parse(savedSession);
        applyRoleConstraints(); // ส่งไปจัดสิทธิ์การหน้าต่าง
    } else {
        // หากยังไม่ได้เข้าสู่ระบบ บังคับโชว์หน้า Login
        document.getElementById('login-view').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        
        // ผูก Event เข้าปุ่ม Submit
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('l-email').value;
            const pass = document.getElementById('l-password').value;
            
            try {
                // ยิงไปที่ Backend ตรวจสอบอีเมล+รหัส
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password: pass })
                });
                
                if(res.ok) {
                    // ล็อกอินผ่าน เซฟลงเครื่อง
                    const user = await res.json();
                    authUser = user;
                    localStorage.setItem('authUser', JSON.stringify(user));
                    
                    document.getElementById('login-error').style.display = 'none';
                    applyRoleConstraints(); // เริ่มรันระบบจัดการ UI
                } else {
                    document.getElementById('login-error').style.display = 'block'; // โชว์เออเร่อพาสผิด
                }
            } catch(e) { console.error('Login Failed', e); }
        });
    }
}

// ฟังก์ชันออกจากระบบ ล้างค่าทุกอย่างแล้วหนีไปหน้า Login
function handleLogout() {
    authUser = null;
    localStorage.removeItem('authUser');
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

// ฟังก์ชันนี้หัวใจหลัก! จำกัดแท็บและปุ่มต่างๆ ตามว่าใครล้อคอินเข้ามา (Admin vs Normal)
function applyRoleConstraints() {
    // 1. ซ่อนหน้าต่าง Login เพื่อเปิดหน้าเนื้อหาหลัก
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    
    // 2. อัพเดทรหัสโปรไฟล์มุมขวาบน
    document.getElementById('auth-user-name').textContent = authUser.name;
    document.getElementById('auth-user-avatar').src = `https://ui-avatars.com/api/?name=${authUser.name}&background=6366f1&color=fff`;
    
    // 3. ปั๊มรหัสผู้ใช้ลงไปในฟอร์มยืม แอบซ่อนไว้อัตโนมัติเวลาส่งคำขอจะได้ใช้รหัสบัญชีตัวเอง
    document.getElementById('b-user-id').value = authUser.id;
    document.getElementById('b-user-name').value = authUser.name;
    document.getElementById('req-user-id').value = authUser.id;

    // 4. ระบบการซ่อนเปิด Class admin-only
    const adminElements = document.querySelectorAll('.admin-only');
    
    if(authUser.type !== 'admin') { // เฉพาะบุคคลที่ไม่ใช่ admin (นักศึกษา,บุคคลทั่วไป)
        // ซ่อนแท็บทั้งหมดที่ระบุว่าเฉพาะแอดมินเท่านั้น
        adminElements.forEach(el => el.style.display = 'none');
        
        // บังคับเปลี่ยนหน้าไป Self-Service ทันที เนื่องจาก Dashboard ของ Admin เข้าไม่ได้
        document.querySelector('[data-target="dashboard"]').classList.remove('active');
        document.querySelector('[data-target="borrow-return"]').classList.add('active');
        
        document.getElementById('dashboard').classList.remove('active');
        document.getElementById('borrow-return').classList.add('active');
        
        activeViewTarget = 'borrow-return';
        updateDynamicTitles(); // อัพเดท Title ข้างบน
    } else {
        // หากเป็น Admin ก็เปิดสิทธิ์ให้เห็นหมดทุกปุ่ม
        adminElements.forEach(el => el.style.display = '');
    }

    // เมื่อตั้งค่าปุ่มเรียบร้อย ก็สั่งโหลด API ยัดข้อมูลเข้าตารางเป้าหมายปัจจุบัน
    if(activeViewTarget === 'dashboard') loadDashboard();
    else if(activeViewTarget === 'borrow-return') { /* ไม่ต้องโหลดหน้ายืม */ }
    else if(activeViewTarget === 'users-list') loadUsers();
    else if(activeViewTarget === 'requests') loadRequests();
    else if(activeViewTarget === 'transactions') loadTransactions();
}

/* ------------------------------------------------------------------------
 * 2. ระบบ UI (Theme, Language, Navigation)
 * ------------------------------------------------------------------------ */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlTag = document.documentElement;
    const savedTheme = localStorage.getItem('appTheme') || 'dark';
    htmlTag.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        let currentTheme = htmlTag.getAttribute('data-theme');
        let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlTag.setAttribute('data-theme', newTheme);
        localStorage.setItem('appTheme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if(theme === 'dark') icon.className = 'fa-solid fa-moon';
    else icon.className = 'fa-solid fa-sun';
}

function initLanguage() {
    applyLanguage(currentLang); 
    document.getElementById('lang-toggle').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'th' : 'en';
        localStorage.setItem('appLang', currentLang);
        applyLanguage(currentLang);
        updateDynamicTitles();
    });
}

function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-placeholder-i18n]').forEach(el => {
        const key = el.getAttribute('data-placeholder-i18n');
        if(translations[lang][key]) el.setAttribute('placeholder', translations[lang][key]);
    });
}

function updateDynamicTitles() {
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const mapKeys = {
        'dashboard': {t: 'dashboard_title', s: 'dashboard_subtitle'},
        'borrow-return': {t: 'nav_self_service', s: 'borrow_book'},
        'books': {t: 'nav_books', s: 'library_resources'},
        'users-list': {t: 'nav_users', s: 'all_users'},
        'requests': {t: 'nav_procurement', s: 'suggest_book'},
        'transactions': {t: 'nav_transactions', s: 'all_transactions'}
    };
    if(mapKeys[activeViewTarget]) {
        pageTitle.textContent = translations[currentLang][mapKeys[activeViewTarget].t];
        pageSubtitle.textContent = translations[currentLang][mapKeys[activeViewTarget].s];
    }
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); 
            const target = item.getAttribute('data-target');
            
            // ปกป้องไม่ให้แอบเข้าหากไม่ได้เป็น admin
            if(authUser && authUser.type !== 'admin' && (target === 'dashboard' || target === 'users-list')) {
                return;
            }

            activeViewTarget = target;
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            updateDynamicTitles();

            if(target === 'dashboard') loadDashboard();
            if(target === 'books') loadBooks();
            if(target === 'users-list') loadUsers();
            if(target === 'requests') loadRequests();
            if(target === 'transactions') loadTransactions();
        });
    });

    // ดัก Event จากการตกลง Submit กดปุ่ม 
    document.getElementById('borrow-form').addEventListener('submit', handleBorrow);
    document.getElementById('return-form').addEventListener('submit', handleReturn);
    document.getElementById('request-form').addEventListener('submit', handleRequest);
    document.getElementById('user-form').addEventListener('submit', handleAddUser);
    document.getElementById('approve-form').addEventListener('submit', handleApproveRequest); // เมนู Admin กดจัดซื้อ 
}

function showMessage(msgKey, isError = false, defaultMsg = "") {
    const messageStr = translations[currentLang]?.[msgKey] || defaultMsg || "Notification";
    
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-alert';
    toast.innerHTML = isError ? `<i class="fa-solid fa-triangle-exclamation"></i> ${messageStr}` : `<i class="fa-solid fa-check-circle"></i> ${messageStr}`;
    toast.style.cssText = `
        background: ${isError ? 'var(--danger)' : 'var(--primary)'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        font-size: 14px;
        animation: slideInRight 0.3s ease-out forwards;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ------------------------------------------------------------------------
 * 3. ระบบโหลดข้อมูล Database (API Communication) & แยกตาม Role
 * ------------------------------------------------------------------------ */

async function loadDashboard() {
    if(authUser.type !== 'admin') return; // ผู้ใช้ธรรมดาจะไม่ดึงข้อมูลนี้ให้เปลืองเน็ต
    try {
        const d_res = await fetch('/api/reports/daily');
        const r_res = await fetch('/api/transactions');
        let daily = await d_res.json();
        let recents = await r_res.json();

        const statsDiv = document.getElementById('daily-stats');
        if(daily.length > 0) {
            const today = daily[daily.length-1];
            statsDiv.innerHTML = `
                <div class="stat-card">
                    <span class="stat-title">Today's Borrows</span><span class="stat-value">${today.total_borrows}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Fines Collected</span><span class="stat-value">฿${today.total_fines_collected || 0}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-title">Active Users Today</span><span class="stat-value">${today.unique_users_borrowing || 0}</span>
                </div>
            `;
        }
        const tbody = document.getElementById('recent-transactions-list');
        tbody.innerHTML = '';
        recents.slice(0, 5).forEach(tr => {
            tbody.innerHTML += `
                <tr>
                    <td>#${tr.transaction_id}</td>
                    <td>${tr.user_name}</td>
                    <td>${tr.book_title}</td>
                    <td><span class="tag ${tr.delivery_type === 'delivery' ? 'pending' : 'available'}">${tr.delivery_type.toUpperCase()}</span></td>
                    <td><span class="tag ${tr.status}">${tr.status.toUpperCase()}</span></td>
                </tr>
            `;
        });
    } catch(err) { console.error(err); } 
}

async function loadBooks() {
    try {
        const res = await fetch('/api/books');
        const books = await res.json();
        const tbody = document.getElementById('books-list');
        tbody.innerHTML = '';
        books.forEach(b => {
            let actionHtml = '';
            if(authUser.type === 'admin') {
                actionHtml = `<td><button class="btn admin-only" style="background:var(--danger); color:#fff; padding:0.3rem 0.6rem; font-size:12px;" onclick="deleteBook(${b.id})">Delete</button></td>`;
            }
            tbody.innerHTML += `
                <tr>
                    <td>${b.id}</td>
                    <td>${b.title}</td>
                    <td>${b.author || '-'}</td>
                    <td><code>${b.barcode_rfid}</code></td>
                    <td><span class="tag ${b.status}">${b.status.toUpperCase()}</span></td>
                    ${authUser.type === 'admin' ? actionHtml : ''}
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

async function loadUsers() {
    if(authUser.type !== 'admin') return; 
    try {
        const res = await fetch('/api/users');
        const users = await res.json();
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';
        users.forEach(u => {
            let color = u.type === 'admin' ? 'lost' : (u.type === 'student' ? 'pending' : (u.type === 'staff' ? 'completed' : 'available'));
            tbody.innerHTML += `
                <tr><td>${u.id}</td><td>${u.name}</td><td><span class="tag ${color}">${u.type.toUpperCase()}</span></td><td>${u.email}</td></tr>
            `;
        });
    } catch(err) { console.error(err); }
}

async function loadTransactions() {
    try {
        // หากผู้ใช้ธรรมดาล็อกอิน เราจะต่อท้าย Query ปลายทางรับ ?user_id=xx ให้เห็นเฉพาะของตัวเอง 
        const paramsStr = authUser.type !== 'admin' ? `?user_id=${authUser.id}` : '';
        const res = await fetch(`/api/transactions${paramsStr}`);
        const trs = await res.json();
        const tbody = document.getElementById('all-transactions-list');
        tbody.innerHTML = '';
        
        // ------------------ คำนวณสรุปข้อมูล (Stats) ------------------
        let activeBorrows = 0;
        let nearExpiry = 0;
        let totalFines = 0;
        const now = new Date();
        
        trs.forEach(tr => {
            if (tr.status === 'active') {
                activeBorrows++;
                const due = new Date(tr.due_date);
                const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 2 && diffDays >= 0) nearExpiry++;
            }
            if(parseFloat(tr.fine_amount) > 0 && !tr.waive_reason) {
                totalFines += parseFloat(tr.fine_amount); // รวมเฉพาะค่าปรับที่ยังไม่โดน Waive ล้างไป
            }
        });

        // วาด UI กล่องสรุป
        const statsGrid = document.getElementById('user-stats-grid');
        statsGrid.innerHTML = `
            <div class="stat-card glass" style="background: rgba(255,255,255,0.03);">
                <i class="fa-solid fa-book-open" style="font-size:24px; color:var(--primary);"></i>
                <div class="stat-info">
                    <h4>กำลังใช้งาน (Active Borrows)</h4>
                    <h2>${activeBorrows} <small style="font-size:14px; font-weight:normal;">เล่ม</small></h2>
                </div>
            </div>
            <div class="stat-card glass" style="background: rgba(255,255,255,0.03);">
                <i class="fa-solid fa-clock-rotate-left" style="font-size:24px; color:var(--warning);"></i>
                <div class="stat-info">
                    <h4>ใกล้กำหนดคืน (≤ 2 วัน)</h4>
                    <h2 class="${nearExpiry > 0 ? 'text-warning' : ''}">${nearExpiry} <small style="font-size:14px; font-weight:normal;">เล่ม</small></h2>
                </div>
            </div>
            <div class="stat-card glass" style="background: rgba(255,255,255,0.03);">
                <i class="fa-solid fa-file-invoice-dollar" style="font-size:24px; color:var(--danger);"></i>
                <div class="stat-info">
                    <h4>ยอดค้างชำระ (Fines)</h4>
                    <h2 class="${totalFines > 0 ? 'text-red' : ''}">฿${totalFines.toFixed(2)}</h2>
                </div>
            </div>
        `;
        // --------------------------------------------------------

        trs.forEach(tr => {
            const isFined = parseFloat(tr.fine_amount) > 0;
            
            let fineText = '-';
            if (tr.waive_reason) {
                fineText = `<div style="color:var(--warning); font-weight:bold; font-size:12px; line-height:1.2;" title="${tr.waive_reason}"><i class="fa-solid fa-heart"></i> ยกเว้น<br><small>(${tr.waive_reason})</small></div>`;
            } else if (isFined) {
                fineText = `฿${tr.fine_amount}`;
            }

            let actionHtml = '';
            if(authUser.type === 'admin') {
                let waiveBtn = isFined ? `<button class="btn" style="background:var(--warning); color:#000; padding:0.3rem 0.5rem; font-size:12px; margin-right:4px;" onclick="waiveFine(${tr.transaction_id})" title="Waive Fine"><i class="fa-solid fa-wand-magic-sparkles"></i></button>` : '';
                actionHtml = `<td>${waiveBtn}<button class="btn admin-only" style="background:#475569; color:#fff; padding:0.3rem 0.5rem; font-size:12px;" onclick="deleteTransaction(${tr.transaction_id})" title="Delete"><i class="fa-solid fa-trash"></i></button></td>`;
            }
            tbody.innerHTML += `
                <tr>
                    <td>#${tr.transaction_id}</td>
                    <td>${tr.user_name} <br> <small>${tr.user_type}</small></td>
                    <td>${tr.book_title}</td>
                    <td>${new Date(tr.borrow_date).toLocaleDateString()}</td>
                    <td>${new Date(tr.due_date).toLocaleDateString()}</td>
                    <td class="${isFined ? 'text-red' : ''}" style="${isFined ? 'color: var(--danger); font-weight: 800;' : ''}">${fineText}</td>
                    <td><span class="tag ${tr.status}">${tr.status.toUpperCase()}</span></td>
                    ${authUser.type === 'admin' ? actionHtml : ''}
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

async function loadRequests() {
    try {
        // เช่นเดียวกัน ฝั่งรับจะเห็นเฉพาะรายการหนังสือของตัวเอง หากไม่ใช่ Admin
        const paramsStr = authUser.type !== 'admin' ? `?user_id=${authUser.id}` : '';
        const res = await fetch(`/api/requests${paramsStr}`);
        const reqs = await res.json();
        const tbody = document.getElementById('requests-list');
        tbody.innerHTML = '';
        
        reqs.forEach(r => {
            // ส่วนควบคุมพิเศษ : หากเป็น Admin และหนังสือนี้ยังไม่ซื้อ (pending) โชว์ปุ่ม 'Approve'
            let actionHtml = '';
            if(authUser.type === 'admin') {
                if(r.status === 'pending') {
                    // ฝัง ID ของ Request และชื่อเรื่องส่งไปเข้าสู่ฟังก์ชันเปิดกล่อง เพิ่มปุ่ม Reject เข้าไปด้วย
                    actionHtml = `
                        <button class="btn primary" style="padding: 0.3rem 0.6rem; font-size:12px;" onclick="openApproveModal(${r.id}, '${r.title.replace(/'/g,"\\'").replace(/"/g,"&quot;")}')">Approve</button>
                        <button class="btn" style="background:var(--danger); color:#fff; padding: 0.3rem 0.6rem; font-size:12px; margin-left:4px;" onclick="rejectRequest(${r.id})">Reject</button>
                    `;
                } else if(r.status === 'rejected') {
                    actionHtml = '<span style="color:var(--danger); font-size:12px;">Rejected</span>';
                } else {
                    actionHtml = '<span style="color:var(--text-muted); font-size:12px;">Completed</span>';
                }
                actionHtml += ` <button class="btn" style="background:#475569; color:#fff; padding: 0.3rem 0.6rem; font-size:12px; margin-left:8px;" onclick="deleteRequest(${r.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${r.id}</td>
                    <td>${r.title}</td>
                    <td>${r.requester}</td>
                    <td>${new Date(r.request_date).toLocaleDateString()}</td>
                    <td><span class="tag ${r.status}">${r.status.toUpperCase()}</span></td>
                    ${authUser.type === 'admin' ? `<td>${actionHtml}</td>` : ''} <!-- แทรกปุ่ม Approve ถ้าระดับสิทธิผ่าน -->
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

/* เปิดกล่องกรอกรหัสบาร์โค้ดให้กับรายการจัดซื้อที่ถูกเลือก (เมื่อ Admin กดอนุมัติ) */
function openApproveModal(id, title) {
    document.getElementById('approve-card').style.display = 'block'; // โชว์กรอบฟอร์มส่วนบน
    document.getElementById('ap-request-id').value = id;
    document.getElementById('ap-title').value = title;
    
    // เด้งสกอร์หน้าตาลงมาหาฟอร์มเพื่อให้พิมพ์รหัสบาร์โค้ดสะดวกสุด
    document.getElementById('approve-card').scrollIntoView({ behavior: 'smooth' });
}

async function rejectRequest(id) {
    if(!confirm('ปฏิเสธคำขอซื้อหนังสือใช่หรือไม่? (Are you sure you want to reject this request?)')) return;
    try {
        const res = await fetch(`/api/requests/reject`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ request_id: id })
        });
        if(res.ok) { showMessage('msg_req_reject'); loadRequests(); }
        else { const data = await res.json(); showMessage(null, true, data.error); }
    } catch(e) { showMessage('msg_network_error', true); }
}

async function deleteRequest(id) {
    if(!confirm('ลบคำร้องนี้ทิ้งถาวรใช่หรือไม่? (Delete permanently?)')) return;
    try {
        const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
        if(res.ok) { showMessage('msg_req_deleted'); loadRequests(); }
        else { const data = await res.json(); showMessage(null, true, data.error); }
    } catch(e) { showMessage('msg_network_error', true); }
}

async function deleteBook(id) {
    if(!confirm('แน่ใจหรือไม่ที่จะลบหนังสือเล่มนี้ออกจากระบบถาวร? (Are you sure you want to delete this book?)')) return;
    try {
        const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
        if(res.ok) { showMessage('msg_book_deleted'); loadBooks(); }
        else { const data = await res.json(); showMessage(null, true, data.error); }
    } catch(e) { showMessage('msg_network_error', true); }
}

async function deleteTransaction(id) {
    if(!confirm('ลบประวัติการทำรายการนี้ใช่หรือไม่? (Delete this transaction?)')) return;
    try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if(res.ok) { showMessage('msg_tr_deleted', false, 'ลบประวัติรายการสำเร็จ!'); loadTransactions(); }
        else { const data = await res.json(); showMessage(null, true, data.error); }
    } catch(e) { showMessage('msg_network_error', true); }
}

async function waiveFine(id) {
    const reason = prompt('กรุณาระบุเหตุผลที่ต้องการยกเว้นค่าปรับ (เช่น ป่วย, ลากิจ, สุดวิสัย):');
    if(reason === null) return; // cancelled
    if(reason.trim() === '') {
        alert('กรุณากรอกเหตุผลด้วยครับ');
        return;
    }
    try {
        const res = await fetch(`/api/transactions/${id}/waive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if(res.ok) {
            showMessage('msg_fine_waived', false, 'ยกเว้นค่าปรับและบันทึกเหตุผลเรียบร้อย!');
            loadTransactions();
        } else {
            const data = await res.json();
            showMessage(null, true, data.error);
        }
    } catch(e) {
        showMessage('msg_network_error', true);
    }
}

/* ------------------------------------------------------------------------
 * 4. ระบบส่งข้อมูลขึ้นเซิร์ฟเวอร์ (API POST Forms)
 * ------------------------------------------------------------------------ */

async function handleBorrow(e) { e.preventDefault(); 
    const payload = {
        user_id: document.getElementById('b-user-id').value, // ถูกยัดไว้แล้วในตอนเข้าสู่ระบบ
        barcode_rfid: document.getElementById('b-barcode').value,
        borrow_type: document.getElementById('b-type').value
    };
    try {
        const res = await fetch('/api/borrow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) { showMessage('msg_borrow_success'); document.getElementById('borrow-form').reset(); } 
        else { showMessage(null, true, data.error); }
    } catch(err) { showMessage('msg_network_error', true); }
}

async function handleReturn(e) { e.preventDefault();
    const payload = { barcode_rfid: document.getElementById('r-barcode').value };
    try {
        const res = await fetch('/api/return', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) { showMessage('msg_return_success'); document.getElementById('return-form').reset(); } 
        else { showMessage(null, true, data.error); }
    } catch(err) { showMessage('msg_network_error', true); }
}

async function handleRequest(e) { e.preventDefault();
    const payload = {
        title: document.getElementById('req-title').value,
        user_id: document.getElementById('req-user-id').value // ใช้รหัสตัวบัญชีโดยตรง ไม่ให้คนอื่นมากรอกมั่ว
    };
    try {
        const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) { showMessage('msg_req_success'); document.getElementById('request-form').reset(); loadRequests(); } 
        else { showMessage(null, true, data.error); }
    } catch(err) { showMessage('msg_network_error', true); }
}

async function handleAddUser(e) { e.preventDefault();
    const payload = {
        name: document.getElementById('u-name').value,
        email: document.getElementById('u-email').value,
        password: document.getElementById('u-pass').value,
        type: document.getElementById('u-type').value
    };
    try {
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) { showMessage('msg_add_user_success'); document.getElementById('user-form').reset(); loadUsers(); } 
        else { showMessage(null, true, data.error); }
    } catch(err) { showMessage('msg_network_error', true); }
}

/* Event คอยจัดการเวลากดปุ่ม ยืนยันมอบรหัสบาร์โค๊ดให้ระบบจัดซื้อสำเร็จ (Approve) */
async function handleApproveRequest(e) { e.preventDefault();
    const payload = {
        request_id: document.getElementById('ap-request-id').value,
        author: document.getElementById('ap-author').value,
        barcode_rfid: document.getElementById('ap-barcode').value
    };
    try {
        const res = await fetch('/api/requests/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if(res.ok) {
            showMessage('msg_req_approve');
            document.getElementById('approve-form').reset(); // ปิดฝาฟอร์มให้สะอาด
            document.getElementById('approve-card').style.display = 'none'; // โดนซ่อนกลับไปหลังอนุมัติเสร็จ
            loadRequests(); 
        } 
        else { showMessage(null, true, data.error); }
    } catch(err) { showMessage('msg_network_error', true); }
}
