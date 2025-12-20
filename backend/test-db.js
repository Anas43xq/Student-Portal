const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'Configurations.env') });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });

    const [rows] = await conn.query('SELECT 1 as ok');
    console.log('DB connection successful:', rows);
    await conn.end();
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
})();