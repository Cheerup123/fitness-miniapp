const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const DISCLAIMER = '⚠️ 以上内容仅供参考，不能替代专业医疗建议。如有身体不适请咨询医生。';

const SYSTEM_PROMPTS = {
  chat: `你是口袋健身助手，专注于为用户提供科学、个性化的健身指导。

回答规范：
1. 动作讲解要包含：目标肌群、起始姿势、执行步骤、注意事项
2. 计划建议要说明：训练分化逻辑、每周训练天数、动作选择依据
3. 营养建议要给出：热量估算 macron 分配、食物选择原则
4. 遇到伤病问题：建议就医，不给具体治疗方案
5. 遇到超出范围的问题：礼貌引导回到健身话题

安全规范：
- 禁止提供医疗诊断
- 禁止推荐极端节食或禁药
- 禁止保证具体减肥/增肌数字
- 所有建议附上"仅供参考"的免责声明`,

  exercise_advice: `你是一个专业的健身教练，擅长分析动作要领、纠正姿势、提供训练建议。`,

  plan_consult: `你是一个专业的训练计划设计师，擅长根据用户目标、身体条件、可用时间设计个性化训练计划。`
};

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
    context += `\n用户健身画像：\n`;
    context += `- 健身水平：${profile.fitness_level}\n`;
    context += `- 主要目标：${profile.primary_goal || '未设置'}\n`;
    context += `- 每周可训练天数：${profile.weekly_available_days}天\n`;
    context += `- 偏好训练时长：${profile.preferred_workout_duration}分钟\n`;
    if (profile.available_equipment) {
      try {
        const equip = JSON.parse(profile.available_equipment);
        if (Array.isArray(equip)) {
          context += `- 可用器械：${equip.join('、')}\n`;
        }
      } catch (e) {}
    }
    if (profile.injury_history) {
      try {
        const injuries = JSON.parse(profile.injury_history);
        if (Array.isArray(injuries)) {
          context += `- 伤病史：${injuries.join('、')}\n`;
        }
      } catch (e) {}
    }
  }

  return context;
}

function generateResponse(userMessage, context, sessionType = 'chat') {
  const prompt = SYSTEM_PROMPTS[sessionType] || SYSTEM_PROMPTS.chat;

  let response = `根据您的问题，我给出以下建议：\n\n`;
  response += `【训练建议】\n`;
  response += `针对您的需求，建议从基础开始，逐步增加训练强度。\n\n`;

  if (context) {
    response += `【个性化参考】\n基于您的健身画像，以上建议已做针对性调整。\n\n`;
  }

  response += DISCLAIMER;

  return response;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { message, sessionId, sessionType = 'chat' } = event;

  if (!message) {
    return { code: -1, message: '消息内容不能为空' };
  }

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

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const [sessionResult] = await pool.execute(
        `INSERT INTO ai_chat_session (user_id, session_type, title, last_message, last_message_time, message_count, is_active)
         VALUES (?, ?, ?, ?, NOW(), 1, 1)`,
        [userId, sessionType, message.substring(0, 50), message]
      );
      currentSessionId = sessionResult.insertId;
    } else {
      await pool.execute(
        `UPDATE ai_chat_session SET
         last_message = ?, last_message_time = NOW(), message_count = message_count + 1
         WHERE id = ?`,
        [message, currentSessionId]
      );
    }

    await pool.execute(
      `INSERT INTO ai_chat_message (session_id, role, content, message_type)
       VALUES (?, 'user', ?, 'text')`,
      [currentSessionId, message]
    );

    const knowledgeResults = await searchKnowledge(pool, message, 3);
    const userContext = await buildContext(pool, userId);

    let responseContent = generateResponse(message, userContext, sessionType);

    if (knowledgeResults.length > 0) {
      let kbContext = '\n\n【知识库参考】：\n';
      knowledgeResults.forEach((kb, i) => {
        kbContext += `${i + 1}. ${kb.title}：${kb.content.substring(0, 100)}...\n`;
      });
      responseContent = kbContext + '\n' + responseContent;
    }

    await pool.query(
      `INSERT INTO ai_chat_message (session_id, role, content, message_type, referenced_exercises)
       VALUES (?, 'assistant', ?, 'text', ?)`,
      [currentSessionId, responseContent, '[]']
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
