const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { planId, planDayId } = event;
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

    // 创建训练记录
    const now = new Date();
    const [result] = await pool.execute(
      `INSERT INTO workout_log 
       (user_id, plan_id, plan_day_id, workout_date, start_time, status) 
       VALUES (?, ?, ?, CURDATE(), ?, 'in_progress')`,
      [userId, planId || null, planDayId || null, now]
    );
    const workoutLogId = result.insertId;

    // 如果有计划日，加载动作列表
    let exercises = [];
    if (planDayId) {
      const [rows] = await pool.execute(
        `SELECT pe.exercise_id, e.name, e.exercise_type, e.equipment,
                e.demo_image_url, pe.sets, pe.reps, pe.rest_sec,
                pe.duration_sec, pe.notes
         FROM plan_exercise pe
         JOIN exercise e ON e.id = pe.exercise_id
         WHERE pe.plan_day_id = ?
         ORDER BY pe.sort_order`,
        [planDayId]
      );
      exercises = rows;

      // 预创建 workout_log_exercise 记录
      for (let i = 0; i < rows.length; i++) {
        const [logEx] = await pool.execute(
          `INSERT INTO workout_log_exercise (workout_log_id, exercise_id, sort_order) 
           VALUES (?, ?, ?)`,
          [workoutLogId, rows[i].exercise_id, i]
        );

        // 预创建组记录
        const setsCount = rows[i].sets || 1;
        for (let s = 1; s <= setsCount; s++) {
          await pool.execute(
            `INSERT INTO workout_log_set (log_exercise_id, set_number, set_type, is_completed) 
             VALUES (?, ?, 'normal', 0)`,
            [logEx.insertId, s]
          );
        }
      }
    }

    return {
      code: 0,
      data: {
        workoutLogId,
        exercises,
        startTime: now.toISOString()
      }
    };
  } catch (err) {
    console.error('workout-start error:', err);
    return { code: -1, message: err.message };
  }
};
