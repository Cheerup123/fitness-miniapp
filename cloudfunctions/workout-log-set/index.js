const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { workoutLogId, exerciseId, setNumber, weightKg, reps, durationSec, distanceM, notes } = event;
  const pool = getPool();

  if (!workoutLogId || !exerciseId || setNumber === undefined) {
    return { code: -1, message: '缺少必要参数' };
  }

  try {
    // 验证训练记录属于当前用户
    const [logs] = await pool.execute(
      `SELECT wl.id FROM workout_log wl 
       JOIN user u ON u.id = wl.user_id 
       WHERE wl.id = ? AND u.openid = ? AND wl.status = 'in_progress'`,
      [workoutLogId, OPENID]
    );
    if (logs.length === 0) {
      return { code: -1, message: '训练记录不存在或已结束' };
    }

    // 查找对应的 log_exercise 记录
    const [logExercises] = await pool.execute(
      `SELECT id FROM workout_log_exercise 
       WHERE workout_log_id = ? AND exercise_id = ?`,
      [workoutLogId, exerciseId]
    );

    let logExerciseId;
    if (logExercises.length > 0) {
      logExerciseId = logExercises[0].id;
    } else {
      // 如果不存在则创建
      const [maxOrder] = await pool.execute(
        `SELECT MAX(sort_order) as max_order FROM workout_log_exercise WHERE workout_log_id = ?`,
        [workoutLogId]
      );
      const nextOrder = (maxOrder[0].max_order || 0) + 1;
      const [newLogEx] = await pool.execute(
        `INSERT INTO workout_log_exercise (workout_log_id, exercise_id, sort_order) VALUES (?, ?, ?)`,
        [workoutLogId, exerciseId, nextOrder]
      );
      logExerciseId = newLogEx.insertId;
    }

    // 查询是否PR（个人最佳）
    let isPr = 0;
    if (weightKg && reps) {
      const [prRecords] = await pool.execute(
        `SELECT wls.weight_kg, wls.reps 
         FROM workout_log_set wls
         JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
         JOIN workout_log wl ON wl.id = wle.workout_log_id
         JOIN user u ON u.id = wl.user_id
         WHERE u.openid = ? AND wle.exercise_id = ? AND wls.is_completed = 1
         ORDER BY wls.weight_kg DESC, wls.reps DESC
         LIMIT 1`,
        [OPENID, exerciseId]
      );

      if (prRecords.length === 0 || 
          weightKg > prRecords[0].weight_kg || 
          (weightKg === prRecords[0].weight_kg && reps > prRecords[0].reps)) {
        isPr = 1;
      }
    }

    // 更新或插入组记录
    const [existing] = await pool.execute(
      `SELECT id FROM workout_log_set WHERE log_exercise_id = ? AND set_number = ?`,
      [logExerciseId, setNumber]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE workout_log_set 
         SET weight_kg = ?, reps = ?, duration_sec = ?, distance_m = ?, 
             notes = ?, is_completed = 1, is_pr = ?
         WHERE id = ?`,
        [weightKg || null, reps || null, durationSec || null, distanceM || null,
         notes || null, isPr, existing[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO workout_log_set 
         (log_exercise_id, set_number, weight_kg, reps, duration_sec, distance_m, notes, is_completed, is_pr)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [logExerciseId, setNumber, weightKg || null, reps || null,
         durationSec || null, distanceM || null, notes || null, isPr]
      );
    }

    return {
      code: 0,
      data: { isPr, logExerciseId }
    };
  } catch (err) {
    console.error('workout-log-set error:', err);
    return { code: -1, message: err.message };
  }
};
