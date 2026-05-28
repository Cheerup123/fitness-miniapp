const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { 
    name, 
    description, 
    difficultyLevel, 
    fitnessGoal, 
    durationWeeks, 
    daysPerWeek, 
    avgDurationMin,
    days 
  } = event;

  const pool = getPool();

  // 参数校验
  if (!name || !difficultyLevel || !fitnessGoal || !durationWeeks || !daysPerWeek) {
    return { code: -1, message: '缺少必要参数' };
  }

  if (!days || !Array.isArray(days) || days.length === 0) {
    return { code: -1, message: '计划天数不能为空' };
  }

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
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. 创建计划
      const [planResult] = await conn.execute(
        `INSERT INTO workout_plan 
         (name, description, difficulty_level, fitness_goal, duration_weeks, days_per_week, avg_duration_min, is_system, created_by, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 1, NOW(), NOW())`,
        [name, description || '', difficultyLevel, fitnessGoal, durationWeeks, daysPerWeek, avgDurationMin || 45, userId]
      );

      const planId = planResult.insertId;

      // 2. 创建计划天数和动作
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        
        // 插入计划天
        const [dayResult] = await conn.execute(
          `INSERT INTO plan_day (plan_id, week_number, day_of_week, day_label, is_rest_day, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [planId, day.weekNumber || 1, day.dayOfWeek || (i + 1), day.dayLabel || `第${i + 1}天`, day.isRestDay ? 1 : 0, i]
        );

        const planDayId = dayResult.insertId;

        // 如果不是休息日，插入动作
        if (!day.isRestDay && day.exercises && Array.isArray(day.exercises)) {
          for (let j = 0; j < day.exercises.length; j++) {
            const ex = day.exercises[j];
            await conn.execute(
              `INSERT INTO plan_exercise 
               (plan_day_id, exercise_id, sets, reps, duration_sec, rest_sec, sort_order, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                planDayId, 
                ex.exerciseId, 
                ex.sets || 3, 
                ex.reps || '10-12', 
                ex.durationSec || null, 
                ex.restSec || 60, 
                j,
                ex.notes || ''
              ]
            );
          }
        }
      }

      await conn.commit();

      return {
        code: 0,
        data: {
          planId,
          message: '计划创建成功'
        }
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('plan-create error:', err);
    return { code: -1, message: err.message };
  }
};
