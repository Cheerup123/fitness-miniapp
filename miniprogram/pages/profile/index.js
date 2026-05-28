const { callFunction, showToast } = require('../../utils/request');
const { FITNESS_GOALS, FITNESS_LEVELS } = require('../../utils/constants');

Page({
  data: {
    userInfo: null,
    stats: { totalWorkouts: 0, streakDays: 0, totalDuration: 0 },
    goalLabel: '',
    levelLabel: '',
    menuList: [
      { icon: '🏋️', title: '训练历史', url: '/pages/workout/history' },
      { icon: '📈', title: '身体数据', url: '/pages/body/index' },
      { icon: '🏆', title: '个人最佳', url: '/pages/profile/pr-records' },
      { icon: '⭐', title: '收藏动作', url: '/pages/profile/favorites' },
      { icon: '🏅', title: '我的成就', url: '/pages/profile/achievements' },
      { icon: '⚙️', title: '设置', url: '' }
    ]
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    try {
      const res = await callFunction('user-login');
      const user = res.user;
      if (user) {
        const goal = FITNESS_GOALS.find(g => g.value === user.fitness_goal);
        const level = FITNESS_LEVELS.find(l => l.value === user.fitness_level);
        this.setData({
          userInfo: user,
          goalLabel: goal ? `${goal.icon} ${goal.label}` : '未设置',
          levelLabel: level ? level.label : '未设置'
        });
        getApp().globalData.userInfo = user;
      }
    } catch (err) {
      console.error(err);
    }
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/profile/edit' });
  },

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      if (url.includes('switchTab')) {
        wx.switchTab({ url });
      } else {
        wx.navigateTo({ url });
      }
    } else {
      showToast('功能开发中');
    }
  },

  onShareAppMessage() {
    return {
      title: '运动健身助手 — 科学训练，高效健身',
      path: '/pages/index/index'
    };
  }
});
