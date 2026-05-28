const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { checkinType = 'workout' } = event;
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

    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已打卡
    const [existing] = await pool.execute(
      'SELECT id FROM checkin WHERE user_id = ? AND checkin_date = ?',
      [userId, today]
    );

    if (existing.length > 0) {
      return {
        code: 0,
        data: {
          alreadyCheckedIn: true,
          message: '今天已打卡'
        }
      };
    }

    // 创建打卡记录
    await pool.execute(
      'INSERT INTO checkin (user_id, checkin_date, checkin_type) VALUES (?, ?, ?)',
      [userId, today, checkinType]
    );

    // 计算连续打卡天数
    const [streakResult] = await pool.execute(
      `SELECT checkin_date FROM checkin 
       WHERE user_id = ? AND checkin_date <= ?
       ORDER BY checkin_date DESC`,
      [userId, today]
    );

    let streakDays = 0;
    const todayDate = new Date(today);
    for (let i = 0; i < streakResult.length; i++) {
      const checkinDate = new Date(streakResult[i].checkin_date);
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (checkinDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streakDays++;
      } else {
        break;
      }
    }

    // 检查成就
    const [achievements] = await pool.execute(
      `SELECT a.* FROM achievement a
       WHERE a.condition_type = 'streak_days' AND a.condition_value <= ?
       AND NOT EXISTS (
         SELECT 1 FROM user_achievement ua WHERE ua.user_id = ? AND ua.achievement_id = a.id
       )`,
      [streakDays, userId]
    );

    const unlockedAchievements = [];
    for (const achievement of achievements) {
      try {
        await pool.execute(
          'INSERT INTO user_achievement (user_id, achievement_id) VALUES (?, ?)',
          [userId, achievement.id]
        );
        unlockedAchievements.push(achievement);
      } catch (e) {
        // 忽略重复
      }
    }

    // 获取本周打卡情况
    const [weekCheckins] = await pool.execute(
      `SELECT checkin_date FROM checkin 
       WHERE user_id = ? AND checkin_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
       ORDER BY checkin_date`,
      [userId]
    );

    return {
      code: 0,
      data: {
        alreadyCheckedIn: false,
        streakDays,
        unlockedAchievements,
        weekCheckins: weekCheckins.map(c => c.checkin_date)
      }
    };
  } catch (err) {
    console.error('checkin-daily error:', err);
    return { code: -1, message: err.message };
  }
};
