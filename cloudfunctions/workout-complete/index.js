const cloud = require('wx-server-sdk');
const { getPool } = require('../db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { workoutLogId, feelingScore, notes } = event;
  const pool = getPool();

  if (!workoutLogId) {
    return { code: -1, message: '缺少训练记录ID' };
  }

  try {
    // 验证训练记录属于当前用户
    const [logs] = await pool.execute(
      `SELECT wl.*, u.id as uid FROM workout_log wl 
       JOIN user u ON u.id = wl.user_id 
       WHERE wl.id = ? AND u.openid = ? AND wl.status = 'in_progress'`,
      [workoutLogId, OPENID]
    );
    if (logs.length === 0) {
      return { code: -1, message: '训练记录不存在或已结束' };
    }

    const log = logs[0];
    const now = new Date();

    // 计算训练时长(秒)
    const startTime = new Date(log.start_time);
    const durationSec = Math.floor((now - startTime) / 1000);

    // 统计总组数和总训练量
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_sets,
         COALESCE(SUM(wls.weight_kg * wls.reps), 0) as total_volume
       FROM workout_log_set wls
       JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
       WHERE wle.workout_log_id = ? AND wls.is_completed = 1`,
      [workoutLogId]
    );

    // 估算消耗卡路里
    const [calorieStats] = await pool.execute(
      `SELECT 
         COALESCE(SUM(
           CASE 
             WHEN e.calories_per_rep IS NOT NULL THEN e.calories_per_rep * wls.reps
             WHEN e.calories_per_min IS NOT NULL AND wls.duration_sec IS NOT NULL 
               THEN e.calories_per_min * (wls.duration_sec / 60)
             ELSE 0
           END
         ), 0) as estimated_calories
       FROM workout_log_set wls
       JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
       JOIN exercise e ON e.id = wle.exercise_id
       WHERE wle.workout_log_id = ? AND wls.is_completed = 1`,
      [workoutLogId]
    );

    const totalSets = stats[0].total_sets;
    const totalVolume = stats[0].total_volume;
    const estimatedCalories = Math.round(calorieStats[0].estimated_calories * 100) / 100;

    // 更新训练记录
    await pool.execute(
      `UPDATE workout_log 
       SET end_time = ?, duration_min = ?, total_volume_kg = ?, 
           total_sets = ?, estimated_calories = ?, feeling_score = ?, 
           notes = ?, status = 'completed'
       WHERE id = ?`,
      [now, durationSec, totalVolume, totalSets, estimatedCalories,
       feelingScore || null, notes || null, workoutLogId]
    );

    // 自动打卡
    const workoutDate = log.workout_date;
    try {
      await pool.execute(
        `INSERT INTO checkin (user_id, checkin_date, workout_log_id, checkin_type)
         VALUES (?, ?, ?, 'workout')
         ON DUPLICATE KEY UPDATE workout_log_id = VALUES(workout_log_id)`,
        [log.uid, workoutDate, workoutLogId]
      );
    } catch (ciErr) {
      console.error('checkin error:', ciErr);
      // 打卡失败不影响训练完成
    }

    // 检查并解锁成就
    const unlockedAchievements = await checkAchievements(pool, log.uid);

    // 获取连续打卡天数
    const [streakResult] = await pool.execute(
      `SELECT COUNT(*) as streak FROM (
         SELECT checkin_date FROM checkin 
         WHERE user_id = ? AND checkin_date <= CURDATE()
         ORDER BY checkin_date DESC
       ) t`,
      [log.uid]
    );

    // 更精确的连续天数计算
    const [streakDays] = await pool.execute(
      `WITH RECURSIVE dates AS (
         SELECT CURDATE() as d
         UNION ALL
         SELECT d - INTERVAL 1 DAY FROM dates WHERE d > (SELECT MIN(checkin_date) FROM checkin WHERE user_id = ?)
       )
       SELECT COUNT(*) as streak FROM dates d
       WHERE EXISTS (SELECT 1 FROM checkin c WHERE c.user_id = ? AND c.checkin_date = d.d)
       AND d.d <= CURDATE()
       ORDER BY d.d DESC LIMIT 365`,
      [log.uid, log.uid]
    );

    return {
      code: 0,
      data: {
        workoutLogId,
        durationSec,
        totalSets,
        totalVolume: parseFloat(totalVolume),
        estimatedCalories,
        feelingScore,
        unlockedAchievements,
        streakDays: streakDays.length
      }
    };
  } catch (err) {
    console.error('workout-complete error:', err);
    return { code: -1, message: err.message };
  }
};

// 检查并解锁成就
async function checkAchievements(pool, userId) {
  const unlocked = [];

  try {
    // 获取用户统计
    const [stats] = await pool.execute(
      `SELECT 
         (SELECT COUNT(*) FROM workout_log WHERE user_id = ? AND status = 'completed') as total_workouts,
         (SELECT COALESCE(SUM(total_volume_kg), 0) FROM workout_log WHERE user_id = ? AND status = 'completed') as total_volume,
         (SELECT COALESCE(SUM(duration_min), 0) FROM workout_log WHERE user_id = ? AND status = 'completed') as total_duration
       FROM dual`,
      [userId, userId, userId]
    );

    // 计算连续天数
    const [streak] = await pool.execute(
      `SELECT COUNT(*) as streak FROM (
         SELECT checkin_date FROM checkin WHERE user_id = ? ORDER BY checkin_date DESC
       ) t`,
      [userId]
    );

    const userStats = {
      total_workouts: stats[0].total_workouts,
      total_volume: Math.floor(stats[0].total_volume),
      total_duration: stats[0].total_duration,
      streak_days: streak[0].streak
    };

    // 获取所有成就
    const [achievements] = await pool.execute('SELECT * FROM achievement');

    // 获取已解锁成就
    const [unlockedIds] = await pool.execute(
      'SELECT achievement_id FROM user_achievement WHERE user_id = ?',
      [userId]
    );
    const unlockedSet = new Set(unlockedIds.map(u => u.achievement_id));

    for (const achievement of achievements) {
      if (unlockedSet.has(achievement.id)) continue;

      const value = userStats[achievement.condition_type] || 0;
      if (value >= achievement.condition_value) {
        try {
          await pool.execute(
            'INSERT INTO user_achievement (user_id, achievement_id) VALUES (?, ?)',
            [userId, achievement.id]
          );
          unlocked.push(achievement);
        } catch (e) {
          // 忽略重复插入
        }
      }
    }
  } catch (err) {
    console.error('checkAchievements error:', err);
  }

  return unlocked;
}
