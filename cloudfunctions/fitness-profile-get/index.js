const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

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

    const [profiles] = await pool.execute(
      'SELECT * FROM user_fitness_profile WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      return {
        code: 0,
        data: {
          profile: null,
          isNew: true
        }
      };
    }

    const profile = profiles[0];

    if (profile.injury_history) {
      try { profile.injury_history = JSON.parse(profile.injury_history); } catch (e) {}
    }
    if (profile.available_equipment) {
      try { profile.available_equipment = JSON.parse(profile.available_equipment); } catch (e) {}
    }
    if (profile.health_conditions) {
      try { profile.health_conditions = JSON.parse(profile.health_conditions); } catch (e) {}
    }
    if (profile.training_preferences) {
      try { profile.training_preferences = JSON.parse(profile.training_preferences); } catch (e) {}
    }

    return {
      code: 0,
      data: {
        profile,
        isNew: false
      }
    };
  } catch (err) {
    console.error('fitness-profile-get error:', err);
    return { code: -1, message: err.message };
  }
};
