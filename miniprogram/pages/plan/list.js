const { callFunction, showToast } = require('../../utils/request');
const { FITNESS_GOALS } = require('../../utils/constants');

Page({
  data: {
    activeTab: 'system',
    selectedGoal: '',
    goals: FITNESS_GOALS,
    plans: [],
    loading: false
  },

  onLoad() {
    this.loadPlans();
  },

  onPullDownRefresh() {
    this.loadPlans().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadPlans() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const params = {
        type: this.data.activeTab
      };
      if (this.data.selectedGoal) {
        params.fitnessGoal = this.data.selectedGoal;
      }

      const plans = await callFunction('plan-list', params);
      this.setData({ plans: plans || [] });
    } catch (err) {
      showToast(err.message || '加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
    this.loadPlans();
  },

  onGoalFilter(e) {
    const goal = e.currentTarget.dataset.goal;
    this.setData({ selectedGoal: goal });
    this.loadPlans();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/plan/detail?id=${id}` });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/plan/editor' });
  }
});
