const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const {
    recordDate, weightKg, bodyFatPct, muscleMassKg,
    chestCm, waistCm, hipCm, leftArmCm, rightArmCm,
    leftThighCm, rightThighCm, note
  } = event;
  const pool = getPool();

  try {
    // 查询用户
    const [users] = await pool.execute(
      'SELECT id, height_cm FROM user WHERE openid = ?',
      [OPENID]
    );
    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }
    const userId = users[0].id;
    const heightCm = users[0].height_cm;

    // 自动计算BMI
    let bmi = null;
    if (weightKg && heightCm) {
      const heightM = heightCm / 100;
      bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    }

    const date = recordDate || new Date().toISOString().split('T')[0];

    // 插入或更新记录
    await pool.execute(
      `INSERT INTO body_metric 
       (user_id, record_date, weight_kg, body_fat_pct, muscle_mass_kg, bmi,
        chest_cm, waist_cm, hip_cm, left_arm_cm, right_arm_cm, 
        left_thigh_cm, right_thigh_cm, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        weight_kg = COALESCE(VALUES(weight_kg), weight_kg),
        body_fat_pct = COALESCE(VALUES(body_fat_pct), body_fat_pct),
        muscle_mass_kg = COALESCE(VALUES(muscle_mass_kg), muscle_mass_kg),
        bmi = COALESCE(VALUES(bmi), bmi),
        chest_cm = COALESCE(VALUES(chest_cm), chest_cm),
        waist_cm = COALESCE(VALUES(waist_cm), waist_cm),
        hip_cm = COALESCE(VALUES(hip_cm), hip_cm),
        left_arm_cm = COALESCE(VALUES(left_arm_cm), left_arm_cm),
        right_arm_cm = COALESCE(VALUES(right_arm_cm), right_arm_cm),
        left_thigh_cm = COALESCE(VALUES(left_thigh_cm), left_thigh_cm),
        right_thigh_cm = COALESCE(VALUES(right_thigh_cm), right_thigh_cm),
        note = COALESCE(VALUES(note), note)`,
      [userId, date, weightKg || null, bodyFatPct || null, muscleMassKg || null,
       bmi, chestCm || null, waistCm || null, hipCm || null,
       leftArmCm || null, rightArmCm || null, leftThighCm || null,
       rightThighCm || null, note || null]
    );

    // 同步更新用户当前体重
    if (weightKg) {
      await pool.execute(
        'UPDATE user SET current_weight_kg = ? WHERE id = ?',
        [weightKg, userId]
      );
    }

    return {
      code: 0,
      data: { date, bmi }
    };
  } catch (err) {
    console.error('body-record error:', err);
    return { code: -1, message: err.message };
  }
};
