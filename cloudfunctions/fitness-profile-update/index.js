const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const {
    injuryHistory,
    availableEquipment,
    healthConditions,
    trainingPreferences,
    fitnessLevel,
    bodyType,
    primaryGoal,
    weeklyAvailableDays,
    preferredWorkoutDuration
  } = event;

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

    const [existing] = await pool.execute(
      'SELECT id FROM user_fitness_profile WHERE user_id = ?',
      [userId]
    );

    let profileId;

    if (existing.length === 0) {
      const [result] = await pool.execute(
        `INSERT INTO user_fitness_profile
         (user_id, injury_history, available_equipment, health_conditions, training_preferences,
          fitness_level, body_type, primary_goal, weekly_available_days, preferred_workout_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          injuryHistory ? JSON.stringify(injuryHistory) : null,
          availableEquipment ? JSON.stringify(availableEquipment) : null,
          healthConditions ? JSON.stringify(healthConditions) : null,
          trainingPreferences ? JSON.stringify(trainingPreferences) : null,
          fitnessLevel || 'beginner',
          bodyType || null,
          primaryGoal || null,
          weeklyAvailableDays || 3,
          preferredWorkoutDuration || 60
        ]
      );
      profileId = result.insertId;
    } else {
      profileId = existing[0].id;

      const updateFields = [];
      const updateValues = [];

      if (injuryHistory !== undefined) {
        updateFields.push('injury_history = ?');
        updateValues.push(JSON.stringify(injuryHistory));
      }
      if (availableEquipment !== undefined) {
        updateFields.push('available_equipment = ?');
        updateValues.push(JSON.stringify(availableEquipment));
      }
      if (healthConditions !== undefined) {
        updateFields.push('health_conditions = ?');
        updateValues.push(JSON.stringify(healthConditions));
      }
      if (trainingPreferences !== undefined) {
        updateFields.push('training_preferences = ?');
        updateValues.push(JSON.stringify(trainingPreferences));
      }
      if (fitnessLevel !== undefined) {
        updateFields.push('fitness_level = ?');
        updateValues.push(fitnessLevel);
      }
      if (bodyType !== undefined) {
        updateFields.push('body_type = ?');
        updateValues.push(bodyType);
      }
      if (primaryGoal !== undefined) {
        updateFields.push('primary_goal = ?');
        updateValues.push(primaryGoal);
      }
      if (weeklyAvailableDays !== undefined) {
        updateFields.push('weekly_available_days = ?');
        updateValues.push(weeklyAvailableDays);
      }
      if (preferredWorkoutDuration !== undefined) {
        updateFields.push('preferred_workout_duration = ?');
        updateValues.push(preferredWorkoutDuration);
      }

      if (updateFields.length > 0) {
        updateValues.push(profileId);
        await pool.execute(
          `UPDATE user_fitness_profile SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
    }

    return {
      code: 0,
      data: {
        profileId,
        message: '健身画像已更新'
      }
    };
  } catch (err) {
    console.error('fitness-profile-update error:', err);
    return { code: -1, message: err.message };
  }
};
