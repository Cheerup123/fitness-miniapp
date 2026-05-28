const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { type = 'all', fitnessGoal, difficultyLevel } = event;
  const pool = getPool();

  try {
    // 查询用户ID
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );
    const userId = users.length > 0 ? Number(users[0].id) : null;

    let sql = '';
    let params = [];

    // 构建基础查询
    let whereClause = 'WHERE status = 1';
    
    if (type === 'my' && userId) {
      // 我的计划：用户创建的
      whereClause += ` AND created_by = ?`;
      params = [userId];
    } else if (type === 'system') {
      // 系统预设计划
      whereClause += ` AND is_system = 1`;
      params = [];
    }

    // 可选筛选条件
    if (fitnessGoal) {
      whereClause += ` AND fitness_goal = ?`;
      params.push(fitnessGoal);
    }
    if (difficultyLevel) {
      whereClause += ` AND difficulty_level = ?`;
      params.push(difficultyLevel);
    }

    sql = `SELECT * FROM workout_plan ${whereClause} ORDER BY is_system DESC, created_at DESC`;

    const [plans] = await pool.execute(sql, params);

    // 统计每个计划的动作数量
    const planIds = plans.map(p => p.id);
    let exerciseCounts = {};

    if (planIds.length > 0) {
      const placeholders = planIds.map(() => '?').join(',');
      const [counts] = await pool.execute(
        `SELECT pd.plan_id, COUNT(DISTINCT pe.exercise_id) as exercise_count
         FROM plan_day pd
         LEFT JOIN plan_exercise pe ON pe.plan_day_id = pd.id
         WHERE pd.plan_id IN (${placeholders}) AND pd.is_rest_day = 0
         GROUP BY pd.plan_id`,
        planIds
      );
      counts.forEach(c => {
        exerciseCounts[c.plan_id] = c.exercise_count;
      });
    }

    const result = plans.map(plan => ({
      ...plan,
      exerciseCount: exerciseCounts[plan.id] || 0
    }));

    return {
      code: 0,
      data: result
    };
  } catch (err) {
    console.error('plan-list error:', err);
    return { code: -1, message: err.message };
  }
};
