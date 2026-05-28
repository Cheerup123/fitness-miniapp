const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { sessionId, page = 1, pageSize = 20 } = event;

  if (!sessionId) {
    return { code: -1, message: '会话ID不能为空' };
  }

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

    const [sessions] = await pool.execute(
      'SELECT id FROM ai_chat_session WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      return { code: -1, message: '会话不存在或无权限访问' };
    }

    const offset = (page - 1) * pageSize;
    const [messages] = await pool.execute(
      `SELECT id, role, content, message_type, referenced_exercises, referenced_plans, created_at
       FROM ai_chat_message
       WHERE session_id = ?
       ORDER BY created_at ASC
       LIMIT ? OFFSET ?`,
      [sessionId, pageSize, offset]
    );

    messages.forEach(m => {
      if (m.referenced_exercises) {
        try {
          m.referenced_exercises = JSON.parse(m.referenced_exercises);
        } catch (e) {}
      }
      if (m.referenced_plans) {
        try {
          m.referenced_plans = JSON.parse(m.referenced_plans);
        } catch (e) {}
      }
    });

    return {
      code: 0,
      data: {
        messages,
        page,
        pageSize
      }
    };
  } catch (err) {
    console.error('ai-chat-history error:', err);
    return { code: -1, message: err.message };
  }
};
