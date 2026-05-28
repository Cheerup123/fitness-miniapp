const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DIFFERENTIATION_MATRIX = {
  '2': {
    'beginner': { type: '全身三分化', days: ['全身A', '全身B'] },
    'intermediate': { type: '上下分身', days: ['上肢', '下肢'] },
    'advanced': { type: '推拉腿', days: ['推', '拉腿'] }
  },
  '3': {
    'beginner': { type: '全身三分化', days: ['全身A', '全身B', '全身C'] },
    'intermediate': { type: '上下分身', days: ['上肢A', '下肢', '上肢B'] },
    'advanced': { type: '推拉腿', days: ['推', '拉', '腿'] }
  },
  '4': {
    'beginner': { type: '上下分身', days: ['上肢', '下肢', '上肢', '下肢'] },
    'intermediate': { type: '推拉腿', days: ['推', '拉', '腿', '休息'] },
    'advanced': { type: '推拉腿背', days: ['推', '拉', '腿', '肩臂'] }
  },
  '5': {
    'beginner': { type: '推拉腿', days: ['推', '拉', '腿', '推', '拉'] },
    'intermediate': { type: '推拉腿+', days: ['推', '拉', '腿', '推', '拉腿'] },
    'advanced': { type: '六天分化', days: ['胸', '背', '腿', '肩', '臂', '核心'] }
  },
  '6': {
    'beginner': { type: '推拉腿循环', days: ['推', '拉', '腿', '推', '拉', '腿'] },
    'intermediate': { type: '天天练', days: ['胸背', '肩臂', '腿腹', '胸背', '肩臂', '腿腹'] },
    'advanced': { type: '天天练加强', days: ['胸', '背', '腿', '肩', '臂', '核心'] }
  }
};

const EXERCISE_TEMPLATES = {
  '胸': [
    { name: '杠铃卧推', muscle: '胸肌', equipment: '杠铃', type: 'compound' },
    { name: '哑铃上斜卧推', muscle: '上胸', equipment: '哑铃', type: 'compound' },
    { name: '蝴蝶机夹胸', muscle: '胸肌', equipment: '器械', type: 'isolation' },
    { name: '绳索下拉', muscle: '下胸', equipment: '绳索', type: 'isolation' }
  ],
  '背': [
    { name: '引体向上', muscle: '背阔肌', equipment: '自重', type: 'compound' },
    { name: '杠铃划船', muscle: '中背部', equipment: '杠铃', type: 'compound' },
    { name: '坐姿划船', muscle: '中背部', equipment: '器械', type: 'compound' },
    { name: '哑铃俯身飞鸟', muscle: '肩后束', equipment: '哑铃', type: 'isolation' }
  ],
  '腿': [
    { name: '杠铃深蹲', muscle: '股四头肌', equipment: '杠铃', type: 'compound' },
    { name: '罗马尼亚硬拉', muscle: '腘绳肌', equipment: '杠铃', type: 'compound' },
    { name: '腿举', muscle: '股四头肌', equipment: '器械', type: 'compound' },
    { name: '腿弯举', muscle: '腘绳肌', equipment: '器械', type: 'isolation' },
    { name: '提踵', muscle: '小腿', equipment: '器械', type: 'isolation' }
  ],
  '肩': [
    { name: '哑铃肩推', muscle: '三角肌', equipment: '哑铃', type: 'compound' },
    { name: '侧平举', muscle: '三角肌中束', equipment: '哑铃', type: 'isolation' },
    { name: '面拉', muscle: '肩后束', equipment: '绳索', type: 'isolation' },
    { name: '前平举', muscle: '三角肌前束', equipment: '哑铃', type: 'isolation' }
  ],
  '臂': [
    { name: '杠铃弯举', muscle: '肱二头肌', equipment: '杠铃', type: 'isolation' },
    { name: '锤式弯举', muscle: '肱肌', equipment: '哑铃', type: 'isolation' },
    { name: '绳索下压', muscle: '肱三头肌', equipment: '绳索', type: 'isolation' },
    { name: '哑铃颈后臂屈伸', muscle: '肱三头肌', equipment: '哑铃', type: 'isolation' }
  ],
  '核心': [
    { name: '平板支撑', muscle: '核心', equipment: '自重', type: 'isometric' },
    { name: '卷腹', muscle: '腹直肌', equipment: '自重', type: 'isolation' },
    { name: '悬垂举腿', muscle: '下腹', equipment: '自重', type: 'isolation' },
    { name: '俄罗斯转体', muscle: '腹斜肌', equipment: '自重', type: 'isolation' }
  ],
  '上肢A': [
    { name: '杠铃卧推', muscle: '胸肌', equipment: '杠铃', type: 'compound' },
    { name: '引体向上', muscle: '背阔肌', equipment: '自重', type: 'compound' },
    { name: '哑铃肩推', muscle: '三角肌', equipment: '哑铃', type: 'compound' },
    { name: '杠铃划船', muscle: '中背部', equipment: '杠铃', type: 'compound' }
  ],
  '上肢B': [
    { name: '上斜哑铃卧推', muscle: '上胸', equipment: '哑铃', type: 'compound' },
    { name: '高位下拉', muscle: '背阔肌', equipment: '器械', type: 'compound' },
    { name: '侧平举', muscle: '三角肌中束', equipment: '哑铃', type: 'isolation' },
    { name: '二头弯举', muscle: '肱二头肌', equipment: '哑铃', type: 'isolation' },
    { name: '三头下压', muscle: '肱三头肌', equipment: '绳索', type: 'isolation' }
  ],
  '下肢': [
    { name: '杠铃深蹲', muscle: '股四头肌', equipment: '杠铃', type: 'compound' },
    { name: '罗马尼亚硬拉', muscle: '腘绳肌', equipment: '杠铃', type: 'compound' },
    { name: '腿举', muscle: '股四头肌', equipment: '器械', type: 'compound' },
    { name: '腿弯举', muscle: '腘绳肌', equipment: '器械', type: 'isolation' },
    { name: '提踵', muscle: '小腿', equipment: '器械', type: 'isolation' }
  ],
  '全身A': [
    { name: '深蹲', muscle: '下肢', equipment: '自重', type: 'compound' },
    { name: '俯卧撑', muscle: '胸肌', equipment: '自重', type: 'compound' },
    { name: '划船', muscle: '背部', equipment: '哑铃', type: 'compound' },
    { name: '肩推', muscle: '肩部', equipment: '哑铃', type: 'compound' },
    { name: '平板支撑', muscle: '核心', equipment: '自重', type: 'isometric' }
  ],
  '全身B': [
    { name: '硬拉', muscle: '后链', equipment: '哑铃', type: 'compound' },
    { name: '弓步蹲', muscle: '下肢', equipment: '哑铃', type: 'compound' },
    { name: '双杠臂屈伸', muscle: '三头', equipment: '自重', type: 'compound' },
    { name: '高位划船', muscle: '背部', equipment: '哑铃', type: 'compound' },
    { name: '卷腹', muscle: '腹部', equipment: '自重', type: 'isolation' }
  ],
  '全身C': [
    { name: '深蹲跳', muscle: '下肢', equipment: '自重', type: 'compound' },
    { name: '卧推', muscle: '胸肌', equipment: '哑铃', type: 'compound' },
    { name: '单臂划船', muscle: '背部', equipment: '哑铃', type: 'compound' },
    { name: '阿诺德推举', muscle: '肩部', equipment: '哑铃', type: 'compound' },
    { name: '登山者', muscle: '核心', equipment: '自重', type: 'compound' }
  ],
  '推': [
    { name: '杠铃卧推', muscle: '胸肌', equipment: '杠铃', type: 'compound' },
    { name: '哑铃上斜推', muscle: '上胸', equipment: '哑铃', type: 'compound' },
    { name: '哑铃肩推', muscle: '三角肌', equipment: '哑铃', type: 'compound' },
    { name: '侧平举', muscle: '三角肌中束', equipment: '哑铃', type: 'isolation' },
    { name: '绳索下压', muscle: '肱三头肌', equipment: '绳索', type: 'isolation' }
  ],
  '拉': [
    { name: '引体向上', muscle: '背阔肌', equipment: '自重', type: 'compound' },
    { name: '杠铃划船', muscle: '中背部', equipment: '杠铃', type: 'compound' },
    { name: '面拉', muscle: '肩后束', equipment: '绳索', type: 'isolation' },
    { name: '杠铃弯举', muscle: '肱二头肌', equipment: '杠铃', type: 'isolation' },
    { name: '锤式弯举', muscle: '肱肌', equipment: '哑铃', type: 'isolation' }
  ],
  '腿肩臂': [
    { name: '深蹲', muscle: '下肢', equipment: '自重', type: 'compound' },
    { name: '罗马尼亚硬拉', muscle: '腘绳肌', equipment: '哑铃', type: 'compound' },
    { name: '哑铃肩推', muscle: '三角肌', equipment: '哑铃', type: 'compound' },
    { name: '二头弯举', muscle: '肱二头肌', equipment: '哑铃', type: 'isolation' },
    { name: '三头臂屈伸', muscle: '肱三头肌', equipment: '哑铃', type: 'isolation' }
  ],
  '胸背': [
    { name: '卧推', muscle: '胸肌', equipment: '杠铃', type: 'compound' },
    { name: '引体向上', muscle: '背阔肌', equipment: '自重', type: 'compound' },
    { name: '上斜哑铃推', muscle: '上胸', equipment: '哑铃', type: 'compound' },
    { name: '坐姿划船', muscle: '中背部', equipment: '器械', type: 'compound' },
    { name: '哑铃飞鸟', muscle: '胸肌', equipment: '哑铃', type: 'isolation' }
  ],
  '肩臂': [
    { name: '哑铃肩推', muscle: '三角肌', equipment: '哑铃', type: 'compound' },
    { name: '侧平举', muscle: '三角肌中束', equipment: '哑铃', type: 'isolation' },
    { name: '杠铃弯举', muscle: '肱二头肌', equipment: '杠铃', type: 'isolation' },
    { name: '绳索下压', muscle: '肱三头肌', equipment: '绳索', type: 'isolation' }
  ],
  '腿腹': [
    { name: '深蹲', muscle: '股四头肌', equipment: '自重', type: 'compound' },
    { name: '罗马尼亚硬拉', muscle: '腘绳肌', equipment: '哑铃', type: 'compound' },
    { name: '提踵', muscle: '小腿', equipment: '器械', type: 'isolation' },
    { name: '平板支撑', muscle: '核心', equipment: '自重', type: 'isometric' },
    { name: '卷腹', muscle: '腹直肌', equipment: '自重', type: 'isolation' }
  ],
  '推腿': [
    { name: '卧推', muscle: '胸肌', equipment: '杠铃', type: 'compound' },
    { name: '深蹲', muscle: '下肢', equipment: '杠铃', type: 'compound' },
    { name: '哑铃肩推', muscle: '三角肌', equipment: '哑铃', type: 'compound' },
    { name: '腿举', muscle: '股四头肌', equipment: '器械', type: 'compound' }
  ],
  '拉腿': [
    { name: '引体向上', muscle: '背阔肌', equipment: '自重', type: 'compound' },
    { name: '罗马尼亚硬拉', muscle: '腘绳肌', equipment: '杠铃', type: 'compound' },
    { name: '划船', muscle: '背部', equipment: '哑铃', type: 'compound' },
    { name: '腿弯举', muscle: '腘绳肌', equipment: '器械', type: 'isolation' }
  ]
};

function generatePlanStructure(daysPerWeek, fitnessLevel) {
  const key = String(daysPerWeek);
  const matrix = DIFFERENTIATION_MATRIX[key] || DIFFERENTIATION_MATRIX['3'];
  const level = matrix[fitnessLevel] || matrix['beginner'];

  const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return {
    type: level.type,
    days: level.days.map((dayType, index) => ({
      dayLabel: `${dayLabels[index] || `第${index + 1}天`} - ${dayType}`,
      dayType,
      exercises: []
    }))
  };
}

function selectExercises(dayType, availableEquipment = []) {
  const templates = EXERCISE_TEMPLATES[dayType] || EXERCISE_TEMPLATES['全身A'];

  return templates.map((template, index) => {
    const sets = template.type === 'compound' ? 4 : 3;
    const reps = template.type === 'isometric' ? '30-60秒' : `${8 - index % 2 * 2}-12`;
    const restSec = template.type === 'compound' ? 120 : 90;

    return {
      exerciseName: template.name,
      targetMuscle: template.muscle,
      equipment: template.equipment,
      sets,
      reps,
      restSec,
      notes: template.type === 'compound' ? '主项动作' : '辅助动作'
    };
  });
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const {
    goal,
    fitnessLevel = 'beginner',
    daysPerWeek = 3,
    availableEquipment = [],
    durationWeeks = 8,
    specificNeeds = '',
    sessionId
  } = event;

  const pool = getPool();

  try {
    const [users] = await pool.execute(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );

    let userId;
    if (users.length > 0) {
      userId = users[0].id;
    } else {
      const [insertResult] = await pool.execute(
        'INSERT INTO user (openid, nickname, created_at) VALUES (?, ?, NOW())',
        [OPENID, '健身用户']
      );
      userId = insertResult.insertId;
    }

    const planStructure = generatePlanStructure(daysPerWeek, fitnessLevel);

    const planDays = planStructure.days.map((day, dayIndex) => {
      const exercises = selectExercises(day.dayType, availableEquipment);
      return {
        weekNumber: 1,
        dayOfWeek: dayIndex + 1,
        dayLabel: day.dayLabel,
        isRestDay: day.dayType === '休息',
        sortOrder: dayIndex + 1,
        exercises: exercises.map((ex, exIndex) => ({
          exerciseName: ex.exerciseName,
          targetMuscle: ex.targetMuscle,
          equipment: ex.equipment,
          sets: ex.sets,
          reps: ex.reps,
          restSec: ex.restSec,
          notes: ex.notes,
          sortOrder: exIndex + 1
        }))
      };
    });

    const differentiationLogic = `本计划采用「${planStructure.type}」分化方案。
原因：
1. 根据您的每周${daysPerWeek}天训练时间和${fitnessLevel}水平
2. ${planStructure.type}能够有效平衡训练频率和恢复时间
3. 每个肌群每周可获得${Math.ceil(daysPerWeek * 2 / planStructure.days.length)}次刺激`;

    const progressiveOverload = `渐进超负荷策略：
- 第1-2周：建立基础，以中等重量（15-20RM）为主
- 第3-4周：增加重量至12-15RM
- 第5-6周：进入正式组，增加至8-12RM
- 第7-8周：冲击周，可尝试6-8RM
每2周重量增加约5%，组数优先于重量增加`;

    let sessionIdValue = sessionId;
    if (!sessionIdValue) {
      const [sessionResult] = await pool.execute(
        `INSERT INTO ai_chat_session (user_id, session_type, title, last_message, last_message_time, message_count, is_active)
         VALUES (?, 'plan_consult', ?, ?, NOW(), 1, 1)`,
        [userId, `${goal}训练计划`, 'AI生成了新的训练计划']
      );
      sessionIdValue = sessionResult.insertId;
    }

    const [aiPlanResult] = await pool.execute(
      `INSERT INTO ai_plan (user_id, session_id, input_params, generation_reason, differentiation_logic, progressive_overload, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending_confirm')`,
      [
        userId,
        sessionIdValue,
        JSON.stringify({ goal, fitnessLevel, daysPerWeek, availableEquipment, durationWeeks, specificNeeds }),
        `根据您的目标「${goal}」，结合您的健身水平「${fitnessLevel}」和每周${daysPerWeek}天的训练安排生成`,
        differentiationLogic,
        progressiveOverload
      ]
    );

    return {
      code: 0,
      data: {
        aiPlanId: aiPlanResult.insertId,
        sessionId: sessionIdValue,
        planStructure: planStructure.type,
        days: planDays,
        explanation: {
          differentiation: differentiationLogic,
          progressive: progressiveOverload,
          goal: `目标：${goal}，计划周期：${durationWeeks}周`
        }
      }
    };
  } catch (err) {
    console.error('ai-plan-generate error:', err);
    return { code: -1, message: err.message };
  }
};
