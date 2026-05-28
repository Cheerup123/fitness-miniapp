const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

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

    if (action === 'list') {
      // 获取所有成就及用户解锁状态
      const [achievements] = await pool.execute(
        `SELECT 
          a.*,
          CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
          ua.unlocked_at
         FROM achievement a
         LEFT JOIN user_achievement ua ON ua.achievement_id = a.id AND ua.user_id = ?
         ORDER BY a.category, a.condition_value`,
        [userId]
      );

      // 按分类分组
      const categories = {};
      const categoryNames = {
        workout: '训练达人',
        streak: '坚持打卡',
        volume: '力量突破',
        special: '特别成就'
      };

      for (const achievement of achievements) {
        const cat = achievement.category || 'other';
        if (!categories[cat]) {
          categories[cat] = {
            name: categoryNames[cat] || '其他',
            list: []
          };
        }
        categories[cat].list.push(achievement);
      }

      // 计算统计
      const totalCount = achievements.length;
      const unlockedCount = achievements.filter(a => a.is_unlocked).length;

      return {
        code: 0,
        data: {
          categories: Object.entries(categories).map(([key, value]) => ({
            key,
            ...value
          })),
          stats: {
            total: totalCount,
            unlocked: unlockedCount,
            progress: totalCount > 0 ? Math.round(unlockedCount / totalCount * 100) : 0
          }
        }
      };
    } else if (action === 'check') {
      // 检查新解锁的成就
      const [stats] = await pool.execute(
        `SELECT 
          (SELECT COUNT(*) FROM workout_log WHERE user_id = ? AND status = 'completed') as total_workouts,
          (SELECT COALESCE(SUM(total_volume_kg), 0) FROM workout_log WHERE user_id = ? AND status = 'completed') as total_volume,
          (SELECT COALESCE(SUM(duration_min), 0) FROM workout_log WHERE user_id = ? AND status = 'completed') as total_duration`,
        [userId, userId, userId]
      );

      const [streakResult] = await pool.execute(
        `SELECT COUNT(*) as streak FROM (
           SELECT checkin_date FROM checkin WHERE user_id = ? ORDER BY checkin_date DESC
         ) t`,
        [userId]
      );

      const userStats = {
        total_workouts: stats[0].total_workouts,
        total_volume: Math.floor(stats[0].total_volume),
        total_duration: stats[0].total_duration,
        streak_days: streakResult[0].streak
      };

      // 获取未解锁的成就
      const [achievements] = await pool.execute(
        `SELECT a.* FROM achievement a
         LEFT JOIN user_achievement ua ON ua.achievement_id = a.id AND ua.user_id = ?
         WHERE ua.id IS NULL`,
        [userId]
      );

      const newlyUnlocked = [];

      for (const achievement of achievements) {
        const value = userStats[achievement.condition_type] || 0;
        if (value >= achievement.condition_value) {
          try {
            await pool.execute(
              'INSERT INTO user_achievement (user_id, achievement_id) VALUES (?, ?)',
              [userId, achievement.id]
            );
            newlyUnlocked.push(achievement);
          } catch (e) {
            // 忽略重复插入
          }
        }
      }

      return {
        code: 0,
        data: {
          newlyUnlocked,
          currentStats: userStats
        }
      };
    }

    return { code: -1, message: '未知的操作类型' };
  } catch (err) {
    console.error('achievement error:', err);
    return { code: -1, message: err.message };
  }
};
