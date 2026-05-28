const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { keyword, bodyPartId, exerciseType, equipment, difficulty } = event;
  const page = parseInt(event.page) || 1;
  const pageSize = parseInt(event.pageSize) || 20;
  const pool = getPool();

  try {
    let whereClause = 'WHERE e.status = 1';
    let params = [];

    // 关键词搜索
    if (keyword) {
      whereClause += ' AND (e.name LIKE ? OR e.name_en LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 按身体部位筛选
    if (bodyPartId) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM exercise_body_part ebp 
        WHERE ebp.exercise_id = e.id AND ebp.body_part_id = ?
      )`;
      params.push(bodyPartId);
    }

    // 按类型筛选
    if (exerciseType) {
      whereClause += ' AND e.exercise_type = ?';
      params.push(exerciseType);
    }

    // 按器械筛选
    if (equipment) {
      whereClause += ' AND e.equipment = ?';
      params.push(equipment);
    }

    // 按难度筛选
    if (difficulty) {
      whereClause += ' AND e.difficulty = ?';
      params.push(difficulty);
    }

    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM exercise e ${whereClause}`,
      params
    );
    const total = Number(countResult[0].total);

    // 分页查询
    const offset = (page - 1) * pageSize;
    const limit = Number(pageSize);
    const [exercises] = await pool.execute(
      `SELECT e.*, ec.name as category_name
       FROM exercise e
       LEFT JOIN exercise_category ec ON ec.id = e.category_id
       ${whereClause}
       ORDER BY e.is_compound DESC, e.name
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // 获取每个动作的目标肌群
    const exIds = exercises.map(e => Number(e.id));
    let bodyPartsMap = {};

    if (exIds.length > 0) {
      const placeholders = exIds.map(() => '?').join(',');
      const [bodyParts] = await pool.execute(
        `SELECT ebp.exercise_id, bp.name as body_part_name, ebp.is_primary
         FROM exercise_body_part ebp
         JOIN body_part bp ON bp.id = ebp.body_part_id
         WHERE ebp.exercise_id IN (${placeholders})`,
        exIds
      );
      bodyParts.forEach(bp => {
        if (!bodyPartsMap[bp.exercise_id]) {
          bodyPartsMap[bp.exercise_id] = [];
        }
        bodyPartsMap[bp.exercise_id].push(bp);
      });
    }

    const result = exercises.map(ex => ({
      ...ex,
      bodyParts: bodyPartsMap[ex.id] || []
    }));

    return {
      code: 0,
      data: {
        list: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (err) {
    console.error('exercise-list error:', err);
    return { code: -1, message: err.message };
  }
};
