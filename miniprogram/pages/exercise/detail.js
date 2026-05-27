const { callFunction, showToast } = require('../../utils/request');

Page({
  data: {
    exercise: null,
    loading: true,
    isFavorite: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadExercise(options.id);
    }
  },

  async loadExercise(id) {
    try {
      const res = await callFunction('exercise-detail', { exerciseId: id });
      this.setData({ exercise: res, loading: false });
    } catch (err) {
      this.setData({ loading: false });
      showToast(err.message || '加载失败');
    }
  },

  onPreviewImage() {
    const url = this.data.exercise?.demo_image_url;
    if (url) {
      wx.previewImage({ urls: [url], current: url });
    }
  },

  onToggleFavorite() {
    this.setData({ isFavorite: !this.data.isFavorite });
    showToast(this.data.isFavorite ? '已收藏' : '已取消收藏');
  },

  onShareAppMessage() {
    const ex = this.data.exercise;
    return {
      title: `推荐动作：${ex?.name || '运动动作'}`,
      path: `/pages/exercise/detail?id=${ex?.id}`
    };
  }
});
