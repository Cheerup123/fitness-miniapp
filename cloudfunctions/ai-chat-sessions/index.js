const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { page = 1, pageSize = 20, type } = event;

  const pool = getPool();

  try {
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );

    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }

    const userId = users[0].id;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (type) {
      whereClause += ' AND session_type = ?';
      params.push(type);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM ai_chat_session ${whereClause}`,
      params
    );

    const [sessions] = await pool.execute(
      `SELECT id, session_type, title, last_message, last_message_time, message_count, is_active, created_at
       FROM ai_chat_session
       ${whereClause}
       ORDER BY is_active DESC, last_message_time DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      code: 0,
      data: {
        sessions,
        total: countResult[0].total,
        page,
        pageSize
      }
    };
  } catch (err) {
    console.error('ai-chat-sessions error:', err);
    return { code: -1, message: err.message };
  }
};
