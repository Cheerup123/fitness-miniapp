const { callFunction, showToast, showLoading, hideLoading } = require('../../utils/request');

Page({
  data: {
    prList: [],
    loading: true
  },

  onLoad() {
    this.loadPRList();
  },

  onPullDownRefresh() {
    this.loadPRList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadPRList() {
    this.setData({ loading: true });
    try {
      const res = await callFunction('pr-record', { action: 'list' });
      if (res.code === 0) {
        this.setData({ prList: res.data.list || [] });
      }
    } catch (err) {
      showToast('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  goExerciseDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/exercise/detail?id=${id}` });
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
});
