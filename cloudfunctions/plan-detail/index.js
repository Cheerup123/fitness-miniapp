const cloud = require('wx-server-sdk');
const { getPool } = require('../db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { planId } = event;
  const pool = getPool();

  if (!planId) {
    return { code: -1, message: '缺少计划ID' };
  }

  try {
    // 获取计划基本信息
    const [plans] = await pool.execute(
      'SELECT * FROM workout_plan WHERE id = ? AND status = 1',
      [planId]
    );

    if (plans.length === 0) {
      return { code: -1, message: '计划不存在' };
    }

    const plan = plans[0];

    // 获取计划每日安排
    const [days] = await pool.execute(
      `SELECT * FROM plan_day WHERE plan_id = ? ORDER BY week_number, day_of_week`,
      [planId]
    );

    // 获取每天的动作详情
    const dayIds = days.map(d => d.id);
    let exercisesByDay = {};

    if (dayIds.length > 0) {
      const placeholders = dayIds.map(() => '?').join(',');
      const [exercises] = await pool.execute(
        `SELECT pe.*, e.name as exercise_name, e.exercise_type, e.equipment,
                e.demo_image_url, e.difficulty
         FROM plan_exercise pe
         JOIN exercise e ON e.id = pe.exercise_id
         WHERE pe.plan_day_id IN (${placeholders})
         ORDER BY pe.sort_order`,
        dayIds
      );

      exercises.forEach(ex => {
        if (!exercisesByDay[ex.plan_day_id]) {
          exercisesByDay[ex.plan_day_id] = [];
        }
        exercisesByDay[ex.plan_day_id].push(ex);
      });
    }

    // 组装结果
    const dayList = days.map(day => ({
      ...day,
      exercises: exercisesByDay[day.id] || []
    }));

    return {
      code: 0,
      data: {
        plan,
        days: dayList
      }
    };
  } catch (err) {
    console.error('plan-detail error:', err);
    return { code: -1, message: err.message };
  }
};
