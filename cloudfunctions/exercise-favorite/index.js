const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, exerciseId } = event;

  if (!action || !exerciseId) {
    return { code: -1, message: '缺少必要参数' };
  }

  const pool = getPool();

  try {
    // 获取用户ID
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );

    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }

    const userId = users[0].id;

    if (action === 'add') {
      // 添加收藏
      try {
        await pool.execute(
          'INSERT INTO user_favorite_exercise (user_id, exercise_id, created_at) VALUES (?, ?, NOW())',
          [userId, exerciseId]
        );
        return { code: 0, message: '收藏成功', data: { isFavorite: true } };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return { code: 0, message: '已收藏', data: { isFavorite: true } };
        }
        throw err;
      }
    } else if (action === 'remove') {
      // 取消收藏
      await pool.execute(
        'DELETE FROM user_favorite_exercise WHERE user_id = ? AND exercise_id = ?',
        [userId, exerciseId]
      );
      return { code: 0, message: '取消收藏成功', data: { isFavorite: false } };
    } else if (action === 'check') {
      // 检查是否已收藏
      const [rows] = await pool.execute(
        'SELECT id FROM user_favorite_exercise WHERE user_id = ? AND exercise_id = ?',
        [userId, exerciseId]
      );
      return { code: 0, data: { isFavorite: rows.length > 0 } };
    } else if (action === 'list') {
      // 获取收藏列表
      const [rows] = await pool.execute(
        `SELECT e.*, bp.name as body_part_name 
         FROM user_favorite_exercise ufe
         JOIN exercise e ON e.id = ufe.exercise_id
         LEFT JOIN body_part bp ON bp.id = e.target_body_part_id
         WHERE ufe.user_id = ?
         ORDER BY ufe.created_at DESC`,
        [userId]
      );
      return { code: 0, data: { list: rows } };
    } else {
      return { code: -1, message: '未知的操作类型' };
    }
  } catch (err) {
    console.error('exercise-favorite error:', err);
    return { code: -1, message: err.message };
  }
};
