/**
 * 常量定义
 */

// 健身目标
const FITNESS_GOALS = [
  { value: 'lose_fat', label: '减脂', icon: '🔥' },
  { value: 'gain_muscle', label: '增肌', icon: '💪' },
  { value: 'keep_fit', label: '塑形', icon: '🏃' },
  { value: 'improve_endurance', label: '提升耐力', icon: '⚡' }
];

// 健身水平
const FITNESS_LEVELS = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '高级' }
];

// 性别选项
const GENDER_OPTIONS = [
  { value: 0, label: '未设置' },
  { value: 1, label: '男' },
  { value: 2, label: '女' }
];

// 训练类型
const EXERCISE_TYPES = [
  { value: 'strength', label: '力量', icon: '🏋️' },
  { value: 'cardio', label: '有氧', icon: '🏃' },
  { value: 'flexibility', label: '柔韧', icon: '🧘' },
  { value: 'balance', label: '平衡', icon: '⚖️' }
];

// 器械类型
const EQUIPMENT_TYPES = [
  { value: 'none', label: '徒手' },
  { value: 'dumbbell', label: '哑铃' },
  { value: 'barbell', label: '杠铃' },
  { value: 'machine', label: '器械' },
  { value: 'cable', label: '绳索' },
  { value: 'band', label: '弹力带' }
];

// 难度等级
const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '入门', color: '#4CAF50' },
  { value: 'intermediate', label: '进阶', color: '#FF9800' },
  { value: 'advanced', label: '高级', color: '#F44336' }
];

// 训练感受选项
const FEELING_SCORES = [
  { value: 1, label: '很轻松', emoji: '😊' },
  { value: 2, label: '轻松', emoji: '🙂' },
  { value: 3, label: '适中', emoji: '😐' },
  { value: 4, label: '吃力', emoji: '😤' },
  { value: 5, label: '力竭', emoji: '🤯' }
];

// 组类型
const SET_TYPES = [
  { value: 'normal', label: '正式组' },
  { value: 'warmup', label: '热身组' },
  { value: 'dropset', label: '递减组' },
  { value: 'failure', label: '力竭组' }
];

// 星期映射
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_FULL = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 默认组间休息时间(秒)
const DEFAULT_REST_SEC = 60;

// 每页数据量
const PAGE_SIZE = 20;

module.exports = {
  FITNESS_GOALS,
  FITNESS_LEVELS,
  GENDER_OPTIONS,
  EXERCISE_TYPES,
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS,
  FEELING_SCORES,
  SET_TYPES,
  WEEKDAYS,
  WEEKDAYS_FULL,
  DEFAULT_REST_SEC,
  PAGE_SIZE
};
