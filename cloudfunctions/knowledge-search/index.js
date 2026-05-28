const cloud = require('wx-server-sdk');
const { getPool } = require('./db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { query, category, difficulty, page = 1, pageSize = 10 } = event;

  if (!query && !category) {
    return { code: -1, message: '查询关键词或分类不能同时为空' };
  }

  const pool = getPool();

  try {
    let whereConditions = ['is_active = 1'];
    let params = [];

    if (query) {
      whereConditions.push('(title LIKE ? OR content LIKE ? OR JSON_SEARCH(tags, "one", ?) IS NOT NULL)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    if (difficulty) {
      whereConditions.push('(difficulty_level = ? OR difficulty_level = "all")');
      params.push(difficulty);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const offset = (page - 1) * pageSize;

    const [rows] = await pool.execute(
      `SELECT id, category, title, summary, content, tags, difficulty_level, target_goals,
              view_count, useful_count, created_at
       FROM knowledge_base
       ${whereClause}
       ORDER BY useful_count DESC, view_count DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    rows.forEach(r => {
      if (r.tags) {
        try { r.tags = JSON.parse(r.tags); } catch (e) {}
      }
      if (r.target_goals) {
        try { r.target_goals = JSON.parse(r.target_goals); } catch (e) {}
      }
    });

    await pool.execute(
      `UPDATE knowledge_base SET view_count = view_count + 1 WHERE id IN (${rows.map(() => '?').join(',')})`,
      rows.map(r => r.id)
    );

    return {
      code: 0,
      data: {
        results: rows,
        page,
        pageSize
      }
    };
  } catch (err) {
    console.error('knowledge-search error:', err);
    return { code: -1, message: err.message };
  }
};
