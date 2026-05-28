const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { aiPlanId, planName, description, difficultyLevel, fitnessGoal, durationWeeks, daysPerWeek, days } = event;

  if (!aiPlanId) {
    return { code: -1, message: 'AI计划ID不能为空' };
  }

  if (!planName) {
    return { code: -1, message: '计划名称不能为空' };
  }

  const pool = getPool();

  try {
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );

    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }

    const userId = users[0].id;

    const [aiPlans] = await pool.execute(
      'SELECT * FROM ai_plan WHERE id = ? AND user_id = ?',
      [aiPlanId, userId]
    );

    if (aiPlans.length === 0) {
      return { code: -1, message: 'AI计划不存在' };
    }

    const aiPlan = aiPlans[0];

    const [planResult] = await pool.execute(
      `INSERT INTO workout_plan (name, description, difficulty_level, fitness_goal, duration_weeks, days_per_week, is_system, created_by, status, ai_generated, ai_generation_params)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, 1, ?)`,
      [
        planName,
        description || '',
        difficultyLevel || 'beginner',
        fitnessGoal || 'keep_fit',
        durationWeeks || aiPlan.input_params ? JSON.parse(aiPlan.input_params).durationWeeks : 4,
        daysPerWeek || aiPlan.input_params ? JSON.parse(aiPlan.input_params).daysPerWeek : 3,
        userId,
        aiPlan.input_params
      ]
    );

    const planId = planResult.insertId;

    for (const day of days) {
      const [dayResult] = await pool.execute(
        `INSERT INTO plan_day (plan_id, week_number, day_of_week, day_label, is_rest_day, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [planId, day.weekNumber || 1, day.dayOfWeek || 1, day.dayLabel || '', day.isRestDay ? 1 : 0, day.sortOrder || 1]
      );

      const planDayId = dayResult.insertId;

      if (day.exercises && day.exercises.length > 0) {
        for (const exercise of day.exercises) {
          let exerciseId = exercise.exerciseId;

          if (!exerciseId && exercise.exerciseName) {
            const [existingExercises] = await pool.execute(
              'SELECT id FROM exercise WHERE name = ? LIMIT 1',
              [exercise.exerciseName]
            );

            if (existingExercises.length > 0) {
              exerciseId = existingExercises[0].id;
            } else {
              const [insertExercise] = await pool.execute(
                `INSERT INTO exercise (name, exercise_type, equipment, difficulty, demo_image_url, is_system, created_at)
                 VALUES (?, ?, ?, ?, ?, 1, NOW())`,
                [
                  exercise.exerciseName,
                  exercise.targetMuscle || '其他',
                  exercise.equipment || '自重',
                  difficultyLevel || 'beginner',
                  exercise.demoImageUrl || null
                ]
              );
              exerciseId = insertExercise.insertId;
            }
          }

          if (exerciseId) {
            await pool.execute(
              `INSERT INTO plan_exercise (plan_day_id, exercise_id, sets, reps, rest_sec, sort_order, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [planDayId, exerciseId, exercise.sets || 3, exercise.reps || '8-12', exercise.restSec || 90, exercise.sortOrder || 1, exercise.notes || '']
            );
          }
        }
      }
    }

    await pool.execute(
      `UPDATE ai_plan SET workout_plan_id = ?, status = 'confirmed', confirmed_at = NOW() WHERE id = ?`,
      [planId, aiPlanId]
    );

    return {
      code: 0,
      data: {
        planId,
        message: '计划已保存'
      }
    };
  } catch (err) {
    console.error('ai-plan-confirm error:', err);
    return { code: -1, message: err.message };
  }
};
