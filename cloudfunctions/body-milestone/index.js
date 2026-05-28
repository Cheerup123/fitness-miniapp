const cloud = require('wx-server-sdk');
const { getPool } = require('./db.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  const pool = getPool();

  try {
    // 获取用户ID
    const [users] = await pool.execute(
      'SELECT id, target_weight_kg FROM user WHERE openid = ?',
      [OPENID]
    );

    if (users.length === 0) {
      return { code: -1, message: '用户不存在' };
    }

    const userId = users[0].id;
    const targetWeight = users[0].target_weight_kg;

    if (action === 'list') {
      // 获取所有里程碑
      const milestones = [];

      // 1. 体重里程碑
      const [weightRecords] = await pool.execute(
        `SELECT weight_kg, record_date 
         FROM body_metric 
         WHERE user_id = ? AND weight_kg IS NOT NULL
         ORDER BY record_date ASC`,
        [userId]
      );

      if (weightRecords.length > 0) {
        const firstWeight = weightRecords[0].weight_kg;
        const latestWeight = weightRecords[weightRecords.length - 1].weight_kg;
        const minWeight = Math.min(...weightRecords.map(r => r.weight_kg));
        const maxWeight = Math.max(...weightRecords.map(r => r.weight_kg));

        // 首次记录
        milestones.push({
          type: 'weight_first',
          title: '开始记录',
          description: `首次记录体重 ${firstWeight}kg`,
          date: weightRecords[0].record_date,
          icon: '📝'
        });

        // 目标达成
        if (targetWeight && weightRecords.length > 1) {
          const targetRecord = weightRecords.find(r => {
            const diff = Math.abs(r.weight_kg - targetWeight);
            return diff <= 0.5; // 允许0.5kg误差
          });

          if (targetRecord) {
            milestones.push({
              type: 'weight_goal',
              title: '目标达成',
              description: `达成目标体重 ${targetWeight}kg`,
              date: targetRecord.record_date,
              icon: '🎯'
            });
          }
        }

        // 减重里程碑
        if (firstWeight > latestWeight) {
          const loss = firstWeight - latestWeight;
          const milestones5 = Math.floor(loss / 5);
          
          for (let i = 1; i <= milestones5; i++) {
            const targetLoss = i * 5;
            const record = weightRecords.find(r => firstWeight - r.weight_kg >= targetLoss);
            if (record) {
              milestones.push({
                type: 'weight_loss',
                title: '减重里程碑',
                description: `累计减重 ${targetLoss}kg`,
                date: record.record_date,
                icon: '🔥'
              });
            }
          }
        }

        // 增重里程碑
        if (latestWeight > firstWeight) {
          const gain = latestWeight - firstWeight;
          const milestones5 = Math.floor(gain / 5);
          
          for (let i = 1; i <= milestones5; i++) {
            const targetGain = i * 5;
            const record = weightRecords.find(r => r.weight_kg - firstWeight >= targetGain);
            if (record) {
              milestones.push({
                type: 'weight_gain',
                title: '增重里程碑',
                description: `累计增重 ${targetGain}kg`,
                date: record.record_date,
                icon: '💪'
              });
            }
          }
        }
      }

      // 2. 体脂率里程碑
      const [bodyFatRecords] = await pool.execute(
        `SELECT body_fat_pct, record_date 
         FROM body_metric 
         WHERE user_id = ? AND body_fat_pct IS NOT NULL
         ORDER BY record_date ASC`,
        [userId]
      );

      if (bodyFatRecords.length > 0) {
        const firstBF = bodyFatRecords[0].body_fat_pct;
        const latestBF = bodyFatRecords[bodyFatRecords.length - 1].body_fat_pct;

        // 体脂率下降
        if (firstBF > latestBF) {
          const loss = firstBF - latestBF;
          const milestones5 = Math.floor(loss / 5);
          
          for (let i = 1; i <= milestones5; i++) {
            const targetLoss = i * 5;
            const record = bodyFatRecords.find(r => firstBF - r.body_fat_pct >= targetLoss);
            if (record) {
              milestones.push({
                type: 'bodyfat_loss',
                title: '体脂下降',
                description: `体脂率下降 ${targetLoss}%`,
                date: record.record_date,
                icon: '📉'
              });
            }
          }
        }
      }

      // 3. 连续记录里程碑
      const [consecutiveDays] = await pool.execute(
        `SELECT COUNT(DISTINCT record_date) as days 
         FROM body_metric 
         WHERE user_id = ?`,
        [userId]
      );

      const recordDays = consecutiveDays[0].days;
      const recordMilestones = [7, 30, 60, 90, 180, 365];
      
      for (const days of recordMilestones) {
        if (recordDays >= days) {
          milestones.push({
            type: 'record_streak',
            title: '坚持记录',
            description: `累计记录 ${days} 天`,
            date: weightRecords[weightRecords.length - 1]?.record_date || new Date(),
            icon: '📊'
          });
          break; // 只显示最高级别
        }
      }

      // 按日期排序
      milestones.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        code: 0,
        data: {
          milestones,
          totalDays: recordDays,
          latestWeight: weightRecords[weightRecords.length - 1]?.weight_kg || null,
          targetWeight
        }
      };
    }

    return { code: -1, message: '未知的操作类型' };
  } catch (err) {
    console.error('body-milestone error:', err);
    return { code: -1, message: err.message };
  }
};
