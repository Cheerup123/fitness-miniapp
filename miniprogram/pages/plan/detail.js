const { callFunction, showToast } = require('../../utils/request');
const util = require('../../utils/util');
const { WEEKDAYS } = require('../../utils/constants');

Page({
  data: {
    planId: 0,
    plan: {},
    days: [],
    currentWeek: 1,
    weekCount: 1,
    currentDays: [],
    weekdays: WEEKDAYS,
    difficultyLabel: '',
    goalLabel: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ planId: parseInt(options.id) });
      this.loadPlanDetail();
    }
  },

  async loadPlanDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await callFunction('plan-detail', { planId: this.data.planId });
      
      if (res) {
        const { plan, days } = res;
        const weekCount = plan.duration_weeks || 1;
        
        // 处理每天的动作数据
        const processedDays = days.map(day => ({
          ...day,
          expanded: !day.is_rest_day
        }));

        this.setData({
          plan,
          days: processedDays,
          weekCount,
          difficultyLabel: util.getDifficultyLabel(plan.difficulty_level),
          goalLabel: util.getGoalLabel(plan.fitness_goal)
        });

        this.updateCurrentDays();
      }
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      showToast(err.message || '加载失败');
    }
  },

  onWeekChange(e) {
    const week = e.currentTarget.dataset.week;
    this.setData({ currentWeek: week });
    this.updateCurrentDays();
  },

  updateCurrentDays() {
    const { days, currentWeek } = this.data;
    const currentDays = days.filter(d => d.week_number === currentWeek);
    this.setData({ currentDays });
  },

  toggleDay(e) {
    const index = e.currentTarget.dataset.index;
    const key = `currentDays[${index}].expanded`;
    this.setData({
      [key]: !this.data.currentDays[index].expanded
    });
  },

  startWorkout(e) {
    const dayId = e.currentTarget.dataset.dayId;
    wx.navigateTo({
      url: `/pages/workout/start?planId=${this.data.planId}&planDayId=${dayId}`
    });
  }
});
