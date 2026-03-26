const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'library_db',
  port: process.env.DB_PORT || 3307,
});

async function migrate() {
    try {
        const [rows] = await pool.query('SELECT id, password FROM users');
        for (let user of rows) {
            if (user.password && !user.password.startsWith('$2b$')) {
                const hashed = await bcrypt.hash(user.password, 10);
                await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
                console.log(`Migrated password for user ID ${user.id}`);
            }
        }
        console.log('Migration complete');
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}

migrate();
