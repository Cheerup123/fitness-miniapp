const cloud = require('wx-server-sdk');
const { getPool } = require('../db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const pool = getPool();

  try {
    // 查询用户是否存在
    const [users] = await pool.execute(
      'SELECT * FROM user WHERE openid = ?',
      [OPENID]
    );

    if (users.length > 0) {
      // 用户已存在，返回用户信息
      return {
        code: 0,
        data: {
          isNew: false,
          user: users[0]
        }
      };
    }

    // 新用户，创建记录
    const nickname = event.nickname || '健身新手';
    const avatarUrl = event.avatarUrl || '';

    const [result] = await pool.execute(
      `INSERT INTO user (openid, nickname, avatar_url) VALUES (?, ?, ?)`,
      [OPENID, nickname, avatarUrl]
    );

    const [newUser] = await pool.execute(
      'SELECT * FROM user WHERE id = ?',
      [result.insertId]
    );

    return {
      code: 0,
      data: {
        isNew: true,
        user: newUser[0]
      }
    };
  } catch (err) {
    console.error('user-login error:', err);
    return { code: -1, message: err.message };
  }
};
