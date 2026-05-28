const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { exerciseId } = event;
  const pool = getPool();

  if (!exerciseId) {
    return { code: -1, message: '缺少动作ID' };
  }

  try {
    // 获取动作详情
    const [exercises] = await pool.execute(
      `SELECT e.*, ec.name as category_name
       FROM exercise e
       LEFT JOIN exercise_category ec ON ec.id = e.category_id
       WHERE e.id = ? AND e.status = 1`,
      [exerciseId]
    );

    if (exercises.length === 0) {
      return { code: -1, message: '动作不存在' };
    }

    const exercise = exercises[0];

    // 获取目标肌群
    const [bodyParts] = await pool.execute(
      `SELECT bp.id, bp.name, ebp.is_primary
       FROM exercise_body_part ebp
       JOIN body_part bp ON bp.id = ebp.body_part_id
       WHERE ebp.exercise_id = ?`,
      [exerciseId]
    );

    // 获取用户历史记录(如果有openid)
    const { OPENID } = cloud.getWXContext();
    let history = [];

    if (OPENID) {
      const [users] = await pool.execute(
        'SELECT id FROM user WHERE openid = ?',
        [OPENID]
      );

      if (users.length > 0) {
        const [records] = await pool.execute(
          `SELECT wls.weight_kg, wls.reps, wls.set_number, wl.workout_date
           FROM workout_log_set wls
           JOIN workout_log_exercise wle ON wle.id = wls.log_exercise_id
           JOIN workout_log wl ON wl.id = wle.workout_log_id
           WHERE wle.exercise_id = ? AND wl.user_id = ? AND wls.is_completed = 1
           ORDER BY wl.workout_date DESC, wls.set_number DESC
           LIMIT 20`,
          [exerciseId, users[0].id]
        );
        history = records;
      }
    }

    // 解析JSON字段
    let instructions = exercise.instructions;
    let tips = exercise.tips;
    try {
      if (typeof instructions === 'string') instructions = JSON.parse(instructions);
      if (typeof tips === 'string') tips = JSON.parse(tips);
    } catch (e) {}

    return {
      code: 0,
      data: {
        ...exercise,
        instructions: instructions || [],
        tips: tips || [],
        bodyParts,
        history
      }
    };
  } catch (err) {
    console.error('exercise-detail error:', err);
    return { code: -1, message: err.message };
  }
};
