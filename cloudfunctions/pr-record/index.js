const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, exerciseId } = event;

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

    if (action === 'get') {
      // 获取指定动作的PR记录
      if (!exerciseId) {
        return { code: -1, message: '缺少动作ID' };
      }

      const [rows] = await pool.execute(
        `SELECT 
          MAX(wls.weight_kg) as max_weight,
          MAX(wls.reps) as max_reps,
          MAX(wls.weight_kg * wls.reps) as max_volume,
          COUNT(DISTINCT wl.id) as total_sets,
          MAX(wl.workout_date) as last_date
         FROM workout_log_set wls
         JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
         JOIN workout_log wl ON wl.id = wle.workout_log_id
         WHERE wl.user_id = ? AND wle.exercise_id = ?`,
        [userId, exerciseId]
      );

      // 获取历史记录（用于趋势图）
      const [history] = await pool.execute(
        `SELECT 
          wl.workout_date,
          MAX(wls.weight_kg) as weight,
          MAX(wls.reps) as reps
         FROM workout_log_set wls
         JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
         JOIN workout_log wl ON wl.id = wle.workout_log_id
         WHERE wl.user_id = ? AND wle.exercise_id = ?
         GROUP BY wl.workout_date
         ORDER BY wl.workout_date DESC
         LIMIT 20`,
        [userId, exerciseId]
      );

      return {
        code: 0,
        data: {
          pr: rows[0] || null,
          history: history || []
        }
      };
    } else if (action === 'list') {
      // 获取所有有PR记录的动作列表
      const [rows] = await pool.execute(
        `SELECT 
          e.id,
          e.name,
          e.demo_image_url,
          MAX(wls.weight_kg) as max_weight,
          MAX(wls.reps) as max_reps,
          MAX(wls.weight_kg * wls.reps) as max_volume,
          MAX(wl.workout_date) as last_date
         FROM workout_log_set wls
         JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
         JOIN workout_log wl ON wl.id = wle.workout_log_id
         JOIN exercise e ON e.id = wle.exercise_id
         WHERE wl.user_id = ?
         GROUP BY e.id, e.name, e.demo_image_url
         ORDER BY max_weight DESC`,
        [userId]
      );

      return {
        code: 0,
        data: { list: rows }
      };
    } else if (action === 'check') {
      // 检查新记录是否打破PR
      if (!exerciseId || !event.weight || !event.reps) {
        return { code: -1, message: '缺少必要参数' };
      }

      const [rows] = await pool.execute(
        `SELECT 
          MAX(wls.weight_kg) as max_weight,
          MAX(wls.reps) as max_reps,
          MAX(wls.weight_kg * wls.reps) as max_volume
         FROM workout_log_set wls
         JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
         JOIN workout_log wl ON wl.id = wle.workout_log_id
         WHERE wl.user_id = ? AND wle.exercise_id = ?`,
        [userId, exerciseId]
      );

      const currentPR = rows[0];
      const newWeight = parseFloat(event.weight);
      const newReps = parseInt(event.reps);
      const newVolume = newWeight * newReps;

      const isNewPR = !currentPR.max_weight || 
                       newWeight > currentPR.max_weight ||
                       newReps > currentPR.max_reps ||
                       newVolume > currentPR.max_volume;

      return {
        code: 0,
        data: {
          isNewPR,
          currentPR: {
            maxWeight: currentPR.max_weight,
            maxReps: currentPR.max_reps,
            maxVolume: currentPR.max_volume
          },
          newRecord: {
            weight: newWeight,
            reps: newReps,
            volume: newVolume
          }
        }
      };
    }

    return { code: -1, message: '未知的操作类型' };
  } catch (err) {
    console.error('pr-record error:', err);
    return { code: -1, message: err.message };
  }
};
