const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const ADJUSTMENT_RULES = {
  high_completion_low_rpe: { type: 'increase', ratio: 1.10, reason: '完成率高且感觉轻松，建议增加负荷' },
  high_completion_medium_rpe: { type: 'increase', ratio: 1.05, reason: '完成率高且强度适中，建议小幅增加' },
  high_completion_high_rpe: { type: 'maintain', ratio: 1.00, reason: '完成率高但感觉吃力，维持当前负荷' },
  medium_completion_low_rpe: { type: 'increase', ratio: 1.05, reason: '完成率一般但感觉轻松，建议小幅增加' },
  medium_completion_medium_rpe: { type: 'maintain', ratio: 1.00, reason: '完成率和强度都适中，维持当前负荷' },
  medium_completion_high_rpe: { type: 'decrease', ratio: 0.90, reason: '完成率一般且感觉吃力，建议降低负荷' },
  low_completion_low_rpe: { type: 'maintain', ratio: 1.00, reason: '完成率低但感觉轻松，可能是动力问题' },
  low_completion_medium_rpe: { type: 'decrease', ratio: 0.90, reason: '完成率低且强度偏大，建议降低负荷' },
  low_completion_high_rpe: { type: 'deload', ratio: 0.70, reason: '完成率很低且非常吃力，建议减载恢复' }
};

function determineAdjustment(completionRate, avgRpe) {
  let completionLevel, rpeLevel;

  if (completionRate >= 85) completionLevel = 'high';
  else if (completionRate >= 60) completionLevel = 'medium';
  else completionLevel = 'low';

  if (avgRpe <= 5) rpeLevel = 'low';
  else if (avgRpe <= 7) rpeLevel = 'medium';
  else rpeLevel = 'high';

  const key = `${completionLevel}_completion_${rpeLevel}_rpe`;
  return ADJUSTMENT_RULES[key] || ADJUSTMENT_RULES['medium_completion_medium_rpe'];
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { aiPlanId, weekNumber, completionRate, avgRpe, customNotes } = event;

  if (!aiPlanId) {
    return { code: -1, message: 'AI计划ID不能为空' };
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

    const adjustment = determineAdjustment(completionRate || 0, avgRpe || 5);

    await pool.execute(
      `INSERT INTO plan_load_adjustment
       (ai_plan_id, week_number, adjustment_type, adjustment_ratio, completion_rate, avg_rpe, adjustment_reason, auto_adjust)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [aiPlanId, weekNumber || 1, adjustment.type, adjustment.ratio, completionRate || 0, avgRpe || 5, adjustment.reason + (customNotes ? ` | ${customNotes}` : '')]
    );

    await pool.execute(
      `UPDATE ai_plan SET
       completion_rate = ?, avg_rpe = ?, adjusted_times = adjusted_times + 1, updated_at = NOW()
       WHERE id = ?`,
      [completionRate || 0, avgRpe || 5, aiPlanId]
    );

    const adjustmentDescriptions = {
      'increase': '下周将增加约' + Math.round((adjustment.ratio - 1) * 100) + '%的训练负荷',
      'maintain': '下周将维持当前的训练负荷',
      'decrease': '下周将减少约' + Math.round((1 - adjustment.ratio) * 100) + '%的训练负荷',
      'deload': '下周将进入减载周，训练负荷降至70%以便恢复'
    };

    return {
      code: 0,
      data: {
        adjustmentType: adjustment.type,
        adjustmentRatio: adjustment.ratio,
        description: adjustmentDescriptions[adjustment.type],
        reason: adjustment.reason,
        recommendation: getRecommendation(adjustment.type, completionRate, avgRpe)
      }
    };
  } catch (err) {
    console.error('ai-plan-adjust error:', err);
    return { code: -1, message: err.message };
  }
};

function getRecommendation(type, completionRate, avgRpe) {
  const recommendations = {
    increase: [
      '下周可以尝试增加5-10%的重量',
      '可以在最后1-2组时放慢速度，增加肌肉紧张时间',
      '考虑增加一些超级组来提高训练密度'
    ],
    maintain: [
      '继续保持当前的训练节奏',
      '注意记录每次训练的重量和感受',
      '确保充足的睡眠和营养摄入'
    ],
    decrease: [
      '建议降低组数或重量，专注于动作质量',
      '增加热身时间，减少受伤风险',
      '可以考虑增加有氧或拉伸来帮助恢复'
    ],
    deload: [
      '减载周是训练周期的重要组成部分',
      '降低重量到60-70%，保持训练频率',
      '利用这段时间充分休息和营养补充'
    ]
  };

  return recommendations[type] || recommendations.maintain;
}
