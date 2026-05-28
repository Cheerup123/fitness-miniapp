const { callFunction, showToast } = require('../../utils/request');

Page({
  data: {
    categories: [],
    stats: { total: 0, unlocked: 0, progress: 0 },
    loading: true
  },

  onLoad() {
    this.loadAchievements();
  },

  onPullDownRefresh() {
    this.loadAchievements().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadAchievements() {
    this.setData({ loading: true });
    try {
      const res = await callFunction('achievement', { action: 'list' });
      if (res.code === 0) {
        this.setData({
          categories: res.data.categories || [],
          stats: res.data.stats
        });
      }
    } catch (err) {
      showToast('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
  }
});
