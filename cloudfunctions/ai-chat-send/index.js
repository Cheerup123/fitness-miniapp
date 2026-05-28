const cloud = require('wx-server-sdk');
const tcb = require('@cloudbase/node-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DISCLAIMER = '\n\n⚠️ 以上内容仅供参考，不能替代专业医疗建议。如有身体不适请咨询医生。';

const SYSTEM_PROMPT = `你是口袋健身助手，专注于为用户提供科学、个性化的健身指导。

回答规范：
1. 动作讲解要包含：目标肌群、起始姿势、执行步骤、注意事项
2. 计划建议要说明：训练分化逻辑、每周训练天数、动作选择依据
3. 营养建议要给出：热量估算、宏量营养素分配、食物选择原则
4. 遇到伤病问题：建议就医，不给具体治疗方案
5. 遇到超出范围的问题：礼貌引导回到健身话题

安全规范：
- 禁止提供医疗诊断
- 禁止推荐极端节食或禁药
- 禁止保证具体减肥/增肌数字
- 所有建议附上"仅供参考"的免责声明`;

async function searchKnowledge(pool, query, limit = 3) {
  const searchTerm = `%${query}%`;
  const [rows] = await pool.query(
    `SELECT title, content, category, tags FROM knowledge_base
     WHERE is_active = 1 AND (
       title LIKE ? OR content LIKE ? OR JSON_SEARCH(tags, 'one', ?) IS NOT NULL
     )
     ORDER BY useful_count DESC LIMIT ?`,
    [searchTerm, searchTerm, searchTerm, parseInt(limit)]
  );
  return rows;
}

async function getUserProfile(pool, userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM user_fitness_profile WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function buildContext(pool, userId) {
  const profile = await getUserProfile(pool, userId);
  let context = '';

  if (profile) {
    context += `用户健身画像：\n`;
    context += `- 健身水平：${profile.fitness_level || '未设置'}\n`;
    context += `- 主要目标：${profile.primary_goal || '未设置'}\n`;
    context += `- 每周可训练天数：${profile.weekly_available_days || '未设置'}天\n`;
    context += `- 偏好训练时长：${profile.preferred_workout_duration || '未设置'}分钟\n`;
    if (profile.available_equipment) {
      try {
        const equip = JSON.parse(profile.available_equipment);
        if (Array.isArray(equip) && equip.length > 0) {
          context += `- 可用器械：${equip.join('、')}\n`;
        }
      } catch (e) {}
    }
    if (profile.injury_history) {
      try {
        const injuries = JSON.parse(profile.injury_history);
        if (Array.isArray(injuries) && injuries.length > 0) {
          context += `- 伤病史：${injuries.join('、')}\n`;
        }
      } catch (e) {}
    }
    if (profile.health_conditions) {
      try {
        const health = JSON.parse(profile.health_conditions);
        if (Array.isArray(health) && health.length > 0) {
          context += `- 健康状况：${health.join('、')}\n`;
        }
      } catch (e) {}
    }
  }

  return context;
}

async function callAIModel(messages) {
  try {
    const app = tcb.init({ env: process.env.TCB_ENV_ID || cloud.DYNAMIC_CURRENT_ENV });
    const ai = app.ai();

    // 优先尝试 hunyuan-exp（小程序成长计划）
    try {
      const hunyuanModel = ai.createModel('hunyuan-exp');
      const result = await hunyuanModel.generateText({
        model: 'hunyuan-2.0-instruct-20251111',
        messages: messages,
        temperature: 0.7,
        topP: 0.9
      });
      if (result.text) {
        console.log('hunyuan-exp model success');
        return result.text;
      }
    } catch (hunyuanErr) {
      console.log('hunyuan-exp failed:', hunyuanErr.code || hunyuanErr.message);
    }

    // 回退到 cloudbase 组
    try {
      const cloudbaseModel = ai.createModel('cloudbase');
      const result = await cloudbaseModel.generateText({
        model: 'hy3-preview',
        messages: messages,
        temperature: 0.7,
        topP: 0.9
      });
      if (result.text) {
        console.log('cloudbase model success');
        return result.text;
      }
    } catch (cloudErr) {
      console.log('cloudbase failed:', cloudErr.code || cloudErr.message);
    }

    return null;
  } catch (err) {
    console.error('AI model call error:', err);
    return null;
  }
}

function generateFallbackResponse(userMessage, knowledgeResults, userContext) {
  const lowerMsg = userMessage.toLowerCase();
  let response = '';

  if (lowerMsg.includes('新手') || lowerMsg.includes('开始') || lowerMsg.includes('入门')) {
    response = `欢迎开启健身之旅！作为新手，建议您从以下几个方面入手：\n\n`;
    response += `【起步阶段】\n`;
    response += `1. 建立训练习惯：每周 3 次，每次 30-45 分钟\n`;
    response += `2. 学习基础动作：深蹲、俯卧撑、平板支撑、弓步蹲\n`;
    response += `3. 注重动作质量：宁轻勿假，先掌握正确姿势再增加重量\n`;
    response += `4. 全身训练为主：每次训练覆盖推、拉、腿三大肌群\n\n`;
    response += `【训练计划示例】\n`;
    response += `周一：上肢推（俯卧撑、肩推）+ 核心\n`;
    response += `周三：下肢（深蹲、弓步蹲）+ 核心\n`;
    response += `周五：上肢拉（引体向上/划船）+ 全身\n\n`;
  } else if (lowerMsg.includes('减脂') || lowerMsg.includes('减肥') || lowerMsg.includes('瘦')) {
    response = `减脂的核心是热量赤字（消耗 > 摄入），但需要科学进行：\n\n`;
    response += `【饮食原则】\n`;
    response += `1. 控制总热量：每日减少 300-500 大卡\n`;
    response += `2. 高蛋白摄入：每公斤体重 1.6-2.2g 蛋白质\n`;
    response += `3. 多吃蔬菜：增加饱腹感，补充微量元素\n`;
    response += `4. 减少精制碳水：用糙米、燕麦替代白米白面\n\n`;
    response += `【训练建议】\n`;
    response += `1. 力量训练 + 有氧结合：力量维持肌肉，有氧增加消耗\n`;
    response += `2. HIIT 高效燃脂：每周 2-3 次，每次 20 分钟\n`;
    response += `3. 保证睡眠：7-9 小时，睡眠不足会影响代谢\n\n`;
  } else if (lowerMsg.includes('增肌') || lowerMsg.includes('壮') || lowerMsg.includes('肌肉')) {
    response = `增肌需要热量盈余 + 渐进超负荷刺激：\n\n`;
    response += `【训练原则】\n`;
    response += `1. 渐进超负荷：每周尝试增加重量、次数或组数\n`;
    response += `2. 复合动作为主：深蹲、硬拉、卧推、引体向上\n`;
    response += `3. 训练容量：每个肌群每周 10-20 组正式组\n`;
    response += `4. 休息充足：同一肌群至少休息 48 小时\n\n`;
    response += `【营养策略】\n`;
    response += `1. 热量盈余：每日增加 200-500 大卡\n`;
    response += `2. 蛋白质：每公斤体重 1.6-2.2g\n`;
    response += `3. 碳水：训练前后补充，支持训练表现\n\n`;
  } else if (lowerMsg.includes('饮食') || lowerMsg.includes('吃') || lowerMsg.includes('营养')) {
    response = `科学饮食是健身成果的重要保障：\n\n`;
    response += `【宏量营养素分配】\n`;
    response += `- 蛋白质：占总热量 25-35%（肌肉修复）\n`;
    response += `- 碳水化合物：占总热量 40-50%（能量来源）\n`;
    response += `- 脂肪：占总热量 20-30%（激素合成）\n\n`;
    response += `【实用建议】\n`;
    response += `1. 每餐都要有蛋白质来源（肉、蛋、鱼、豆类）\n`;
    response += `2. 多吃天然食物，减少加工食品\n`;
    response += `3. 保持水分摄入：每天 2-3 升\n`;
    response += `4. 训练后 30 分钟内补充蛋白质和碳水\n\n`;
  } else if (lowerMsg.includes('动作') || lowerMsg.includes('姿势') || lowerMsg.includes('怎么做')) {
    response = `动作规范是安全训练的基础：\n\n`;
    response += `【通用原则】\n`;
    response += `1. 核心收紧：保持躯干稳定，保护腰椎\n`;
    response += `2. 控制节奏：下落 2-3 秒，发力 1 秒\n`;
    response += `3. 全程幅度：在安全范围内做到最大幅度\n`;
    response += `4. 呼吸配合：发力时呼气，还原时吸气\n\n`;
    response += `【常见错误】\n`;
    response += `- 深蹲：膝盖内扣、重心前移\n`;
    response += `- 俯卧撑：塌腰、耸肩\n`;
    response += `- 硬拉：弓背、提前伸膝\n\n`;
  } else {
    response = `感谢您的提问！关于「${userMessage}」，我为您提供以下建议：\n\n`;
    response += `【综合建议】\n`;
    response += `1. 制定明确目标：减脂、增肌或提升体能\n`;
    response += `2. 循序渐进：从低强度开始，逐步增加负荷\n`;
    response += `3. 记录训练：追踪重量、次数和身体变化\n`;
    response += `4. 保持耐心：健身是长期过程，坚持是关键\n\n`;
  }

  if (knowledgeResults && knowledgeResults.length > 0) {
    response += `【知识库参考】\n`;
    knowledgeResults.forEach((kb, i) => {
      response += `${i + 1}. ${kb.title}\n`;
      response += `   ${kb.content.substring(0, 100)}...\n`;
    });
    response += '\n';
  }

  if (userContext) {
    response += `【个性化提示】\n基于您的健身画像，建议根据自身情况调整训练强度。\n\n`;
  }

  response += DISCLAIMER;
  return response;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID || event.openid || 'test_openid_' + Date.now();
  const { message, sessionId, sessionType = 'chat' } = event;

  if (!message) {
    return { code: -1, message: '消息内容不能为空' };
  }

  const pool = getPool();

  try {
    const [users] = await pool.query(
      'SELECT id FROM user WHERE openid = ?',
      [OPENID]
    );

    let userId;
    if (users.length > 0) {
      userId = users[0].id;
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO user (openid, nickname, created_at) VALUES (?, ?, NOW())',
        [OPENID, '健身用户']
      );
      userId = insertResult.insertId;
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const [sessionResult] = await pool.query(
        `INSERT INTO ai_chat_session (user_id, session_type, title, last_message, last_message_time, message_count, is_active)
         VALUES (?, ?, ?, ?, NOW(), 1, 1)`,
        [userId, sessionType, message.substring(0, 50), message]
      );
      currentSessionId = sessionResult.insertId;
    } else {
      await pool.query(
        `UPDATE ai_chat_session SET
         last_message = ?, last_message_time = NOW(), message_count = message_count + 1
         WHERE id = ?`,
        [message, currentSessionId]
      );
    }

    await pool.query(
      `INSERT INTO ai_chat_message (session_id, role, content, message_type)
       VALUES (?, 'user', ?, 'text')`,
      [currentSessionId, message]
    );

    const knowledgeResults = await searchKnowledge(pool, message, 3);
    const userContext = await buildContext(pool, userId);

    let knowledgeContext = '';
    if (knowledgeResults.length > 0) {
      knowledgeContext = '\n\n【知识库参考】：\n';
      knowledgeResults.forEach((kb, i) => {
        knowledgeContext += `${i + 1}. ${kb.title}：${kb.content.substring(0, 150)}...\n`;
      });
    }

    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + (userContext ? '\n\n' + userContext : '') + knowledgeContext },
      { role: 'user', content: message }
    ];

    let responseContent = await callAIModel(aiMessages);
    let modelUsed = 'hy3-preview';
    let tokensUsed = 0;

    if (!responseContent) {
      modelUsed = 'fallback';
      responseContent = generateFallbackResponse(message, knowledgeResults, userContext);
    }

    await pool.query(
      `INSERT INTO ai_chat_message (session_id, role, content, message_type, referenced_exercises, tokens_used, model)
       VALUES (?, 'assistant', ?, 'text', ?, ?, ?)`,
      [currentSessionId, responseContent, '[]', tokensUsed, modelUsed]
    );

    return {
      code: 0,
      data: {
        sessionId: currentSessionId,
        response: responseContent,
        knowledgeReferences: knowledgeResults
      }
    };
  } catch (err) {
    console.error('ai-chat-send error:', err);
    return { code: -1, message: err.message };
  }
};
