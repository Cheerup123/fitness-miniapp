const { callFunction, showToast } = require('../../utils/request');
const util = require('../../utils/util');

Page({
  data: {
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    currentMonth: '',
    monthStats: { count: 0, duration: 0, volume: 0 }
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentMonth: `${now.getFullYear()}年${now.getMonth() + 1}月`
    });
    this.loadHistory();
  },

  onShow() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadHistory();
  },

  onPullDownRefresh() {
    this.setData({ list: [], page: 1, hasMore: true });
    this.loadHistory().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHistory();
    }
  },

  async loadHistory() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await callFunction('workout-history', {
        page: this.data.page,
        pageSize: 20,
        status: 'completed'
      });

      if (res) {
        const list = res.list || [];
        const formatted = list.map(item => ({
          ...item,
          dateStr: util.formatDate(new Date(item.workout_date)),
          durationStr: item.duration_min ? `${Math.round(item.duration_min / 60)}分钟` : '-',
          volumeStr: item.total_volume_kg ? `${Math.round(item.total_volume_kg)}kg` : '-',
          dayOfWeek: util.getWeekdayShort(new Date(item.workout_date))
        }));

        const newList = this.data.page === 1 ? formatted : [...this.data.list, ...formatted];

        // 计算月度统计
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthItems = newList.filter(item => new Date(item.workout_date) >= monthStart);

        this.setData({
          list: newList,
          hasMore: list.length >= 20,
          page: this.data.page + 1,
          monthStats: {
            count: monthItems.length,
            duration: Math.round(monthItems.reduce((sum, item) => sum + (item.duration_min || 0), 0) / 60),
            volume: Math.round(monthItems.reduce((sum, item) => sum + (item.total_volume_kg || 0), 0))
          },
          loading: false
        });
      }
    } catch (err) {
      this.setData({ loading: false });
      showToast(err.message || '加载失败');
    }
  },

  onTapItem(e) {
    const { id } = e.currentTarget.dataset;
    // 可以跳转到详情页，这里简化
    wx.showToast({ title: '训练详情', icon: 'none' });
  }
});
