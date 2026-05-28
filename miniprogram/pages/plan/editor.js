const { callFunction, showToast, showLoading, hideLoading } = require('../../utils/request');
const { FITNESS_GOALS, DIFFICULTY_LEVELS } = require('../../utils/constants');

Page({
  data: {
    // 计划基本信息
    name: '',
    description: '',
    difficultyLevel: 'beginner',
    fitnessGoal: 'keep_fit',
    durationWeeks: 4,
    daysPerWeek: 3,
    avgDurationMin: 45,
    
    // 选项数据
    difficultyLevels: DIFFICULTY_LEVELS,
    fitnessGoals: FITNESS_GOALS,
    durationOptions: [2, 4, 6, 8, 12],
    daysPerWeekOptions: [2, 3, 4, 5, 6, 7],
    
    // 计划天数
    days: [],
    
    // 当前编辑的天数索引
    currentDayIndex: 0,
    
    // 动作选择弹窗
    showExerciseModal: false,
    exercises: [],
    selectedBodyPart: '',
    bodyParts: [],
    
    // 当前编辑的动作
    currentExercise: null,
    exerciseSets: 3,
    exerciseReps: '10-12',
    exerciseRest: 60
  },

  onLoad() {
    this.initDays();
    this.loadBodyParts();
  },

  // 初始化计划天数
  initDays() {
    const days = [];
    for (let i = 0; i < this.data.daysPerWeek; i++) {
      days.push({
        weekNumber: 1,
        dayOfWeek: i + 1,
        dayLabel: `第${i + 1}天`,
        isRestDay: false,
        exercises: []
      });
    }
    this.setData({ days });
  },

  // 加载身体部位
  async loadBodyParts() {
    try {
      const result = await callFunction('exercise-list', { type: 'bodyParts' });
      this.setData({ bodyParts: result || [] });
    } catch (err) {
      console.error('加载身体部位失败:', err);
    }
  },

  // 输入处理
  onNameInput(e) {
    const value = typeof e.detail === 'string' ? e.detail : (e.detail && e.detail.value !== undefined ? e.detail.value : '');
    this.setData({ name: value });
  },

  onDescInput(e) {
    const value = typeof e.detail === 'string' ? e.detail : (e.detail && e.detail.value !== undefined ? e.detail.value : '');
    this.setData({ description: value });
  },

  onDifficultyChange(e) {
    this.setData({ difficultyLevel: e.detail });
  },

  onGoalChange(e) {
    this.setData({ fitnessGoal: e.detail });
  },

  onDurationChange(e) {
    const durationWeeks = this.data.durationOptions[e.detail.value];
    this.setData({ durationWeeks });
  },

  onDaysPerWeekChange(e) {
    const daysPerWeek = this.data.daysPerWeekOptions[e.detail.value];
    this.setData({ daysPerWeek }, () => {
      this.initDays();
    });
  },

  // 切换休息日
  toggleRestDay(e) {
    const index = e.currentTarget.dataset.index;
    const days = this.data.days;
    days[index].isRestDay = !days[index].isRestDay;
    if (days[index].isRestDay) {
      days[index].exercises = [];
    }
    this.setData({ days });
  },

  // 编辑天数标签
  onDayLabelInput(e) {
    const index = e.currentTarget.dataset.index;
    const days = this.data.days;
    days[index].dayLabel = e.detail.value;
    this.setData({ days });
  },

  // 打开动作选择弹窗
  openExerciseModal(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentDayIndex: index,
      showExerciseModal: true,
      selectedBodyPart: ''
    });
    this.loadExercises();
  },

  closeExerciseModal() {
    this.setData({ showExerciseModal: false });
  },

  // 加载动作列表
  async loadExercises() {
    showLoading('加载中');
    try {
      const params = {};
      if (this.data.selectedBodyPart) {
        params.bodyPartId = this.data.selectedBodyPart;
      }
      const result = await callFunction('exercise-list', params);
      this.setData({ exercises: result.list || [] });
    } catch (err) {
      showToast('加载动作失败');
    } finally {
      hideLoading();
    }
  },

  // 筛选身体部位
  filterByBodyPart(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedBodyPart: id }, () => {
      this.loadExercises();
    });
  },

  // 选择动作
  selectExercise(e) {
    const exercise = e.currentTarget.dataset.item;
    this.setData({
      currentExercise: exercise,
      exerciseSets: 3,
      exerciseReps: '10-12',
      exerciseRest: 60
    });
  },

  // 添加动作到计划
  addExerciseToDay() {
    if (!this.data.currentExercise) {
      showToast('请先选择一个动作');
      return;
    }

    const days = this.data.days;
    const dayIndex = this.data.currentDayIndex;
    
    days[dayIndex].exercises.push({
      exerciseId: this.data.currentExercise.id,
      name: this.data.currentExercise.name,
      demoImageUrl: this.data.currentExercise.demo_image_url,
      sets: parseInt(this.data.exerciseSets),
      reps: this.data.exerciseReps,
      restSec: parseInt(this.data.exerciseRest)
    });

    this.setData({
      days,
      showExerciseModal: false,
      currentExercise: null
    });
  },

  // 输入动作参数
  onSetsInput(e) {
    this.setData({ exerciseSets: e.detail.value });
  },

  onRepsInput(e) {
    this.setData({ exerciseReps: e.detail.value });
  },

  onRestInput(e) {
    this.setData({ exerciseRest: e.detail.value });
  },

  // 删除动作
  removeExercise(e) {
    const dayIndex = e.currentTarget.dataset.dayIndex;
    const exIndex = e.currentTarget.dataset.exIndex;
    const days = this.data.days;
    
    days[dayIndex].exercises.splice(exIndex, 1);
    this.setData({ days });
  },

  // 保存计划
  async savePlan() {
    // 校验
    const name = this.data.name || '';
    if (!name.trim()) {
      showToast('请输入计划名称');
      return;
    }

    const validDays = this.data.days.filter(d => !d.isRestDay && d.exercises.length > 0);
    if (validDays.length === 0) {
      showToast('至少有一天包含训练动作');
      return;
    }

    showLoading('创建中');

    try {
      const params = {
        name: name,
        description: this.data.description || '',
        difficultyLevel: this.data.difficultyLevel,
        fitnessGoal: this.data.fitnessGoal,
        durationWeeks: this.data.durationWeeks,
        daysPerWeek: this.data.daysPerWeek,
        avgDurationMin: this.data.avgDurationMin,
        days: this.data.days.map(d => ({
          weekNumber: d.weekNumber,
          dayOfWeek: d.dayOfWeek,
          dayLabel: d.dayLabel,
          isRestDay: d.isRestDay,
          exercises: d.exercises.map(e => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            restSec: e.restSec
          }))
        }))
      };

      const result = await callFunction('plan-create', params);
      
      hideLoading();
      showToast('创建成功');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      hideLoading();
      showToast(err.message || '创建失败');
    }
  }
});
