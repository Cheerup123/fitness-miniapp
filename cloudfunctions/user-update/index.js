const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const pool = getPool();

  try {
    // 查询用户
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );

    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }

    const userId = Number(users[0].id);
    const allowedFields = [
      'nickname', 'avatar_url', 'gender', 'birthday',
      'height_cm', 'current_weight_kg', 'target_weight_kg',
      'fitness_goal', 'fitness_level', 'workout_days_per_week',
      'workout_duration_min'
    ];

    // 构建动态更新SQL
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (event[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(event[field]);
      }
    }

    if (updates.length === 0) {
      return { code: -1, message: '没有需要更新的字段' };
    }

    values.push(userId);
    await pool.execute(
      `UPDATE user SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // 返回更新后的用户信息
    const [updatedUser] = await pool.execute(
      'SELECT * FROM user WHERE id = ?',
      [userId]
    );

    return {
      code: 0,
      data: updatedUser[0]
    };
  } catch (err) {
    console.error('user-update error:', err);
    return { code: -1, message: err.message };
  }
};
