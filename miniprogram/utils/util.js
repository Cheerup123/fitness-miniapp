/**
 * 通用工具函数
 */

// 日期格式化
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  if (!(date instanceof Date) || isNaN(date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// 时间戳转友好时间
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(date, 'MM-DD');
}

// 秒数转时分秒
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0秒';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) return `${h}小时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

// 分钟转友好显示
function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m > 0 ? m + '分钟' : ''}`;
  return `${m}分钟`;
}

// 获取本周日期范围
function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push({
      date: formatDate(d),
      day: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      isToday: formatDate(d) === formatDate(now)
    });
  }
  return dates;
}

// 获取问候语
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

// 难度映射
function getDifficultyLabel(level) {
  const map = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级'
  };
  return map[level] || level;
}

// 难度颜色
function getDifficultyColor(level) {
  const map = {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336'
  };
  return map[level] || '#999999';
}

// 目标映射
function getGoalLabel(goal) {
  const map = {
    lose_fat: '减脂',
    gain_muscle: '增肌',
    keep_fit: '塑形',
    improve_endurance: '提升耐力'
  };
  return map[goal] || goal;
}

// 器械映射
function getEquipmentLabel(equipment) {
  const map = {
    none: '徒手',
    dumbbell: '哑铃',
    barbell: '杠铃',
    machine: '器械',
    cable: '绳索',
    band: '弹力带'
  };
  return map[equipment] || equipment;
}

// 类型映射
function getTypeLabel(type) {
  const map = {
    strength: '力量',
    cardio: '有氧',
    flexibility: '柔韧',
    balance: '平衡'
  };
  return map[type] || type;
}

// BMI计算
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// BMI分类
function getBMICategory(bmi) {
  if (!bmi) return '';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '偏胖';
  return '肥胖';
}

// 数字千分位格式化
function formatNumber(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 防抖函数
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 获取星期几(简短)
function getWeekdayShort(date) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

module.exports = {
  formatDate,
  timeAgo,
  formatDuration,
  formatMinutes,
  getWeekDates,
  getGreeting,
  getDifficultyLabel,
  getDifficultyColor,
  getGoalLabel,
  getEquipmentLabel,
  getTypeLabel,
  calculateBMI,
  getBMICategory,
  formatNumber,
  debounce,
  getWeekdayShort
};
