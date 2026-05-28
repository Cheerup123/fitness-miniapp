const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { startDate, endDate, status = 'completed' } = event;
  const page = parseInt(event.page) || 1;
  const pageSize = parseInt(event.pageSize) || 20;
  const pool = getPool();

  try {
    // 查询用户ID
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );
    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }
    const userId = Number(users[0].id);

    // 构建查询条件
    let whereClause = 'WHERE wl.user_id = ?';
    let params = [userId];

    if (status) {
      whereClause += ' AND wl.status = ?';
      params.push(status);
    }
    if (startDate) {
      whereClause += ' AND wl.workout_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND wl.workout_date <= ?';
      params.push(endDate);
    }

    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM workout_log wl ${whereClause}`,
      params
    );
    const total = Number(countResult[0].total);

    // 分页查询
    const offset = (page - 1) * pageSize;
    const queryParams = [...params, Number(pageSize), Number(offset)];

    const [logs] = await pool.execute(
      `SELECT wl.*, wp.name as plan_name
       FROM workout_log wl
       LEFT JOIN workout_plan wp ON wp.id = wl.plan_id
       ${whereClause}
       ORDER BY wl.workout_date DESC, wl.start_time DESC
       LIMIT ? OFFSET ?`,
      queryParams
    );

    // 获取每条记录的动作列表
    const logIds = logs.map(l => Number(l.id));
    let exercisesByLog = {};

    if (logIds.length > 0) {
      const placeholders = logIds.map(() => '?').join(',');
      const [exercises] = await pool.execute(
        `SELECT wle.workout_log_id, e.name as exercise_name,
                COUNT(DISTINCT wls.id) as set_count,
                COALESCE(SUM(wls.weight_kg * wls.reps), 0) as volume
         FROM workout_log_exercise wle
         JOIN exercise e ON e.id = wle.exercise_id
         LEFT JOIN workout_log_set wls ON wls.log_exercise_id = wle.id AND wls.is_completed = 1
         WHERE wle.workout_log_id IN (${placeholders})
         GROUP BY wle.workout_log_id, e.name
         ORDER BY wle.sort_order`,
        logIds
      );

      exercises.forEach(ex => {
        if (!exercisesByLog[ex.workout_log_id]) {
          exercisesByLog[ex.workout_log_id] = [];
        }
        exercisesByLog[ex.workout_log_id].push(ex);
      });
    }

    const result = logs.map(log => ({
      ...log,
      id: Number(log.id),
      exercises: exercisesByLog[log.id] || []
    }));

    return {
      code: 0,
      data: {
        list: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (err) {
    console.error('workout-history error:', err);
    return { code: -1, message: err.message };
  }
};
