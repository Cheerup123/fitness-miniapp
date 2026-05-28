const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { days = 30 } = event;
  const pool = getPool();

  try {
    // 查询用户
    const [users] = await pool.execute(
      'SELECT id, height_cm, current_weight_kg, target_weight_kg, fitness_goal FROM user WHERE openid = ?',
      [OPENID]
    );
    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }
    const userId = users[0].id;

    // 获取最近N天的身体数据
    const [metrics] = await pool.execute(
      `SELECT * FROM body_metric 
       WHERE user_id = ? AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY record_date ASC`,
      [userId, days]
    );

    // 获取最新记录
    const [latest] = await pool.execute(
      `SELECT * FROM body_metric WHERE user_id = ? ORDER BY record_date DESC LIMIT 1`,
      [userId]
    );

    // 获取体重变化趋势
    const [weightTrend] = await pool.execute(
      `SELECT record_date, weight_kg FROM body_metric 
       WHERE user_id = ? AND weight_kg IS NOT NULL 
       AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY record_date ASC`,
      [userId, days]
    );

    // 获取体脂率变化趋势
    const [fatTrend] = await pool.execute(
      `SELECT record_date, body_fat_pct FROM body_metric 
       WHERE user_id = ? AND body_fat_pct IS NOT NULL
       AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY record_date ASC`,
      [userId, days]
    );

    // 获取体围变化趋势
    const [circumferenceTrend] = await pool.execute(
      `SELECT record_date, chest_cm, waist_cm, hip_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm
       FROM body_metric 
       WHERE user_id = ?
       AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY record_date ASC`,
      [userId, days]
    );

    // 计算BMI
    let currentBmi = null;
    if (latest.length > 0 && latest[0].weight_kg && users[0].height_cm) {
      const heightM = users[0].height_cm / 100;
      currentBmi = Math.round((latest[0].weight_kg / (heightM * heightM)) * 10) / 10;
    }

    // 计算体重变化
    let weightChange = null;
    if (weightTrend.length >= 2) {
      const first = parseFloat(weightTrend[0].weight_kg);
      const last = parseFloat(weightTrend[weightTrend.length - 1].weight_kg);
      weightChange = Math.round((last - first) * 100) / 100;
    }

    // BMI分类
    let bmiCategory = '';
    if (currentBmi) {
      if (currentBmi < 18.5) bmiCategory = '偏瘦';
      else if (currentBmi < 24) bmiCategory = '正常';
      else if (currentBmi < 28) bmiCategory = '偏胖';
      else bmiCategory = '肥胖';
    }

    return {
      code: 0,
      data: {
        user: {
          heightCm: users[0].height_cm,
          currentWeightKg: users[0].current_weight_kg,
          targetWeightKg: users[0].target_weight_kg,
          fitnessGoal: users[0].fitness_goal
        },
        latest: latest[0] || null,
        currentBmi,
        bmiCategory,
        weightChange,
        weightTrend: weightTrend.map(w => ({
          date: w.record_date,
          value: parseFloat(w.weight_kg)
        })),
        fatTrend: fatTrend.map(f => ({
          date: f.record_date,
          value: parseFloat(f.body_fat_pct)
        })),
        circumferenceTrend,
        totalRecords: metrics.length
      }
    };
  } catch (err) {
    console.error('body-stats error:', err);
    return { code: -1, message: err.message };
  }
};
