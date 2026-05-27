Page({
  data: {
    duration: '00:00',
    totalSets: 0,
    totalVolume: 0,
    exerciseCount: 0,
    feelingScore: 3,
    calories: 0,
    shareImage: ''
  },

  onLoad(options) {
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data));
        this.setData(data);
      } catch (e) {
        console.error('解析数据失败:', e);
      }
    }
  },

  onShareAppMessage() {
    return {
      title: `我刚完成了一次训练！${this.data.totalSets}组，${this.data.duration}`,
      path: '/pages/index/index'
    };
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/workout/history' });
  },

  goBodyRecord() {
    wx.navigateTo({ url: '/pages/body/record' });
  }
});
