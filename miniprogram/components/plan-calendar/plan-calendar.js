Component({
  properties: {
    planId: {
      type: Number,
      value: 0
    },
    currentWeek: {
      type: Number,
      value: 1
    }
  },

  data: {
    weeks: [],
    currentWeekData: null,
    weekOptions: [],
    completedDays: []
  },

  lifetimes: {
    attached() {
      this.generateWeekOptions();
      this.loadPlanData();
    }
  },

  observers: {
    'planId': function() {
      this.loadPlanData();
    }
  },

  methods: {
    // 生成周选项
    generateWeekOptions() {
      const options = [];
      for (let i = 1; i <= 12; i++) {
        options.push({ text: `第 ${i} 周`, value: i });
      }
      this.setData({ weekOptions: options });
    },

    // 加载计划数据
    async loadPlanData() {
      if (!this.data.planId) return;

      try {
        const { callFunction } = require('../../utils/request');
        const result = await callFunction('plan-detail', { planId: this.data.planId });
        
        if (result.code === 0) {
          this.processPlanData(result.data);
        }
      } catch (err) {
        console.error('加载计划数据失败:', err);
      }
    },

    // 处理计划数据
    processPlanData(data) {
      const { plan, days } = data;
      const durationWeeks = plan.duration_weeks;
      
      // 生成周数据
      const weeks = [];
      for (let w = 1; w <= durationWeeks; w++) {
        const weekDays = [];
        for (let d = 1; d <= 7; d++) {
          // 查找对应的计划日
          const planDay = days.find(day => day.week_number === w && day.day_of_week === d);
          weekDays.push({
            dayOfWeek: d,
            isRestDay: planDay ? planDay.is_rest_day === 1 : true,
            dayLabel: planDay ? planDay.day_label : '休息日',
            exercises: planDay ? planDay.exercises || [] : [],
            completed: false // 后续从打卡记录获取
          });
        }
        weeks.push({
          weekNumber: w,
          days: weekDays
        });
      }

      this.setData({ weeks });
      this.updateCurrentWeek();
    },

    // 更新当前周显示
    updateCurrentWeek() {
      const currentWeek = this.data.currentWeek;
      const weekData = this.data.weeks.find(w => w.weekNumber === currentWeek);
      this.setData({ currentWeekData: weekData });
    },

    // 周切换
    onWeekChange(e) {
      const week = e.detail;
      this.setData({ currentWeek: week }, () => {
        this.updateCurrentWeek();
      });
      this.triggerEvent('weekChange', { week });
    },

    // 点击某天
    onDayTap(e) {
      const { week, day } = e.currentTarget.dataset;
      const dayData = this.data.weeks[week - 1].days[day - 1];
      
      if (!dayData.isRestDay) {
        this.triggerEvent('dayTap', { 
          weekNumber: week, 
          dayOfWeek: day,
          dayData 
        });
      }
    },

    // 标记完成状态
    markDayCompleted(weekNumber, dayOfWeek, completed = true) {
      const weeks = this.data.weeks;
      const weekIndex = weeks.findIndex(w => w.weekNumber === weekNumber);
      if (weekIndex > -1) {
        const dayIndex = weeks[weekIndex].days.findIndex(d => d.dayOfWeek === dayOfWeek);
        if (dayIndex > -1) {
          weeks[weekIndex].days[dayIndex].completed = completed;
          this.setData({ weeks });
          if (this.data.currentWeek === weekNumber) {
            this.updateCurrentWeek();
          }
        }
      }
    }
  }
});
