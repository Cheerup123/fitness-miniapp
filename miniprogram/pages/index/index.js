const { callFunction, showToast } = require('../../utils/request');
const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    greeting: '',
    streakDays: 0,
    todayPlan: null,
    weekDates: [],
    weekWorkoutCount: 0,
    totalWorkoutCount: 0,
    totalDuration: 0,
    todayCheckedIn: false,
    checkinDates: []
  },

  onLoad() {
    this.setData({ greeting: util.getGreeting() });
    this.initWeekDates();
  },

  async onShow() {
    await this.loadUserInfo();
    this.loadTodayPlan();
    this.loadStats();
    this.loadCheckinStatus();
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadUserInfo(),
      this.loadTodayPlan(),
      this.loadStats(),
      this.loadCheckinStatus()
    ]).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  initWeekDates() {
    const weekDates = util.getWeekDates();
    this.setData({ weekDates });
  },

  async loadUserInfo() {
    try {
      const res = await callFunction('user-login');
      this.setData({ userInfo: res.user });
      getApp().globalData.userInfo = res.user;
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  },

  async loadTodayPlan() {
    try {
      const plans = await callFunction('plan-list', { type: 'all' });
      if (!plans || plans.length === 0) return;

      const today = new Date();
      const dayOfWeek = today.getDay() || 7; // 1-7 (周一=1, 周日=7)

      // 优先查找用户自己的计划，然后是系统计划
      const sortedPlans = [...plans].sort((a, b) => {
        if (a.is_system === b.is_system) return 0;
        return a.is_system ? 1 : -1; // 用户计划优先
      });

      for (const plan of sortedPlans) {
        try {
          const detail = await callFunction('plan-detail', { planId: plan.id });
          if (!detail || !detail.days) continue;

          const todayDay = detail.days.find(d => d.day_of_week === dayOfWeek && !d.is_rest_day);
          
          if (todayDay) {
            this.setData({
              todayPlan: {
                planId: plan.id,
                planName: detail.plan.name,
                dayLabel: todayDay.day_label || '训练日',
                exercises: todayDay.exercises || []
              }
            });
            return;
          }
        } catch (err) {
          console.error(`加载计划 ${plan.id} 详情失败:`, err);
          continue;
        }
      }

      // 所有计划今天都是休息日，找下一个最近的训练日
      for (const plan of sortedPlans.slice(0, 3)) {
        try {
          const detail = await callFunction('plan-detail', { planId: plan.id });
          if (!detail || !detail.days) continue;

          const trainingDays = detail.days.filter(d => !d.is_rest_day).sort((a, b) => {
            let diffA = a.day_of_week - dayOfWeek;
            let diffB = b.day_of_week - dayOfWeek;
            if (diffA <= 0) diffA += 7;
            if (diffB <= 0) diffB += 7;
            return diffA - diffB;
          });

          if (trainingDays.length > 0) {
            const nextDay = trainingDays[0];
            this.setData({
              todayPlan: {
                planId: plan.id,
                planName: detail.plan.name + ' (下次)',
                dayLabel: nextDay.day_label || '训练日',
                exercises: nextDay.exercises || []
              }
            });
            return;
          }
        } catch (err) {
          continue;
        }
      }
    } catch (err) {
      console.error('加载今日计划失败:', err);
    }
  },

  async loadStats() {
    try {
      const history = await callFunction('workout-history', { 
        status: 'completed',
        pageSize: 100 
      });
      
      if (history) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1);
        weekStart.setHours(0, 0, 0, 0);

        const weekWorkouts = history.list.filter(log => 
          new Date(log.workout_date) >= weekStart
        );

        // 更新本周打卡状态
        const weekDates = this.data.weekDates.map(item => ({
          ...item,
          checked: history.list.some(log => 
            util.formatDate(new Date(log.workout_date)) === item.date
          )
        }));

        this.setData({
          weekWorkoutCount: weekWorkouts.length,
          totalWorkoutCount: history.total || 0,
          totalDuration: Math.round(history.list.reduce((sum, log) => sum + (log.duration_min || 0), 0) / 60),
          weekDates
        });
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  async loadCheckinStatus() {
    try {
      const weekDates = this.data.weekDates;
      const todayItem = weekDates.find(d => d.isToday);
      this.setData({
        todayCheckedIn: todayItem ? (todayItem.checked || false) : false
      });
    } catch (err) {
      console.error('加载打卡状态失败:', err);
      this.setData({ todayCheckedIn: false });
    }
  },

  async onCheckin() {
    try {
      const res = await callFunction('checkin-daily');
      if (res.alreadyCheckedIn) {
        showToast('今天已打卡');
      } else {
        showToast('打卡成功！🎉');
        this.setData({ todayCheckedIn: true });
        if (res.streakDays > 0) {
          this.setData({ streakDays: res.streakDays });
        }
      }
    } catch (err) {
      showToast(err.message || '打卡失败');
    }
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/index' });
  },

  goPlanDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/plan/detail?id=${id}` });
  },

  goPlanList() {
    wx.navigateTo({ url: '/pages/plan/list' });
  },

  goBodyRecord() {
    wx.navigateTo({ url: '/pages/body/record' });
  },

  goExerciseList() {
    wx.switchTab({ url: '/pages/exercise/list' });
  },

  goWorkoutHistory() {
    wx.navigateTo({ url: '/pages/workout/history' });
  },

  goBodyIndex() {
    wx.navigateTo({ url: '/pages/body/index' });
  }
});
