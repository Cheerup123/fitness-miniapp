const { callFunction, showToast } = require('../../utils/request');

Page({
  data: {
    favorites: [],
    loading: true
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    this.loadFavorites();
  },

  onPullDownRefresh() {
    this.loadFavorites().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadFavorites() {
    this.setData({ loading: true });
    try {
      const res = await callFunction('exercise-favorite', { action: 'list' });
      if (res.code === 0) {
        this.setData({ favorites: res.data.list || [] });
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

  async removeFavorite(e) {
    const id = e.currentTarget.dataset.id;
    try {
      const res = await callFunction('exercise-favorite', { 
        action: 'remove', 
        exerciseId: id 
      });
      if (res.code === 0) {
        showToast('已取消收藏');
        this.loadFavorites();
      }
    } catch (err) {
      showToast('操作失败');
    }
  }
});
