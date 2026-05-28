const { callFunction, showToast, showLoading, hideLoading } = require('../../utils/request');

Page({
  data: {
    currentStep: 1,
    goal: 'gain_muscle',
    fitnessLevel: 'beginner',
    daysPerWeek: 3,
    durationWeeks: 8,
    durationOptions: [4, 6, 8, 10, 12],
    durationIndex: 2,
    equipmentOptions: [
      { name: 'barbell', label: '杠铃', selected: true },
      { name: 'dumbbell', label: '哑铃', selected: true },
      { name: 'machine', label: '器械', selected: false },
      { name: 'cable', label: '绳索', selected: false },
      { name: 'bodyweight', label: '自重', selected: true }
    ],
    generating: false,
    generatedPlan: null,
    planName: '',
    sessionId: null
  },

  onGoalChange(e) {
    this.setData({ goal: e.detail });
  },

  onLevelChange(e) {
    this.setData({ fitnessLevel: e.detail });
  },

  onDaysChange(e) {
    this.setData({ daysPerWeek: e.detail.value });
  },

  onDurationChange(e) {
    const index = e.detail.value;
    this.setData({
      durationIndex: index,
      durationWeeks: this.data.durationOptions[index]
    });
  },

  toggleEquipment(e) {
    const index = e.currentTarget.dataset.index;
    const options = this.data.equipmentOptions;
    options[index].selected = !options[index].selected;
    this.setData({ equipmentOptions: options });
  },

  nextStep() {
    this.setData({ currentStep: this.data.currentStep + 1 });
  },

  prevStep() {
    this.setData({ currentStep: Math.max(1, this.data.currentStep - 1), generating: false });
  },

  async generatePlan() {
    const availableEquipment = this.data.equipmentOptions
      .filter(e => e.selected)
      .map(e => e.name);

    this.setData({ generating: true, currentStep: 3 });

    try {
      const result = await callFunction('ai-plan-generate', {
        goal: this.data.goal,
        fitnessLevel: this.data.fitnessLevel,
        daysPerWeek: this.data.daysPerWeek,
        durationWeeks: this.data.durationWeeks,
        availableEquipment
      });

      if (result) {
        this.setData({
          generatedPlan: result,
          sessionId: result.sessionId,
          generating: false,
          planName: `${this.getGoalName(this.data.goal)}${this.data.durationWeeks}周计划`
        });
      }
    } catch (err) {
      showToast(err.message || '生成失败');
      this.setData({ generating: false });
      this.setData({ currentStep: 2 });
    }
  },

  getGoalName(goal) {
    const names = {
      gain_muscle: '增肌',
      lose_fat: '减脂',
      keep_fit: '塑形',
      strength: '力量'
    };
    return names[goal] || '训练';
  },

  onNameInput(e) {
    this.setData({ planName: e.detail.value });
  },

  async confirmPlan() {
    if (!this.data.planName.trim()) {
      showToast('请输入计划名称');
      return;
    }

    showLoading('保存中...');

    try {
      const result = await callFunction('ai-plan-confirm', {
        aiPlanId: this.data.generatedPlan.aiPlanId,
        planName: this.data.planName,
        description: `${this.data.getGoalName}训练计划 - ${this.data.fitnessLevel}水平`,
        difficultyLevel: this.data.fitnessLevel,
        fitnessGoal: this.data.goal,
        durationWeeks: this.data.durationWeeks,
        daysPerWeek: this.data.daysPerWeek,
        days: this.data.generatedPlan.days
      });

      hideLoading();

      if (result) {
        this.setData({ currentStep: 4 });
      }
    } catch (err) {
      hideLoading();
      showToast(err.message || '保存失败');
    }
  },

  goToPlanList() {
    wx.switchTab({ url: '/pages/plan/list' });
  }
});
