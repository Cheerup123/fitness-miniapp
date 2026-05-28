const cloud = require('wx-server-sdk');
const mysql = require('mysql2/promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const config = {
    host: process.env.MYSQL_HOST || '未设置',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || '未设置',
    password: process.env.MYSQL_PASSWORD ? '已设置' : '未设置',
    database: process.env.MYSQL_DATABASE || '未设置',
  };

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectTimeout: 5000,
    });

    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();

    return {
      code: 0,
      message: '数据库连接成功',
      config: {
        ...config,
        password: '***'
      },
      testResult: rows[0]
    };
  } catch (err) {
    return {
      code: -1,
      message: '数据库连接失败: ' + err.message,
      config: {
        ...config,
        password: '***'
      }
    };
  }
};
