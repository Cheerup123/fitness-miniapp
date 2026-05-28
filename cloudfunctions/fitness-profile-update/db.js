const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'sh-cynosdbmysql-grp-g1ha4bxs.sql.tencentcdb.com',
      port: parseInt(process.env.MYSQL_PORT || '26766'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'fitness',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      charset: 'utf8mb4',
      connectTimeout: 10000,
      acquireTimeout: 10000,
    });
  }
  return pool;
}

async function getConnection() {
  const pool = getPool();
  return await pool.getConnection();
}

module.exports = { getPool, getConnection };
