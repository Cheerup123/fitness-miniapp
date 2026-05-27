const { callFunction, showToast } = require('../../utils/request');
const { EXERCISE_TYPES, EQUIPMENT_TYPES, BODY_PARTS } = require('../../utils/constants');

Page({
  data: {
    exercises: [],
    categories: [],
    bodyParts: [],
    currentTab: 'all',
    searchKeyword: '',
    currentBodyPart: '',
    currentType: '',
    currentEquipment: '',
    page: 1,
    hasMore: true,
    loading: false,
    showFilter: false
  },

  onLoad() {
    this.loadBodyParts();
    this.loadExercises();
  },

  onShow() {
    // tabBar 页每次显示都刷新
  },

  onPullDownRefresh() {
    this.setData({ exercises: [], page: 1, hasMore: true });
    this.loadExercises().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadExercises();
    }
  },

  async loadBodyParts() {
    try {
      // 身体部位从云函数获取，这里用常量
      this.setData({
        bodyParts: [
          { id: 1, name: '胸部' }, { id: 2, name: '背部' }, { id: 3, name: '肩部' },
          { id: 4, name: '手臂' }, { id: 5, name: '腿部' }, { id: 6, name: '核心' },
          { id: 7, name: '全身' }
        ]
      });
    } catch (err) {
      console.error(err);
    }
  },

  async loadExercises() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await callFunction('exercise-list', {
        page: this.data.page,
        pageSize: 20,
        keyword: this.data.searchKeyword || undefined,
        bodyPartId: this.data.currentBodyPart || undefined,
        exerciseType: this.data.currentType || undefined,
        equipment: this.data.currentEquipment || undefined
      });

      if (res) {
        const list = res.list || [];
        const newList = this.data.page === 1 ? list : [...this.data.exercises, ...list];
        this.setData({
          exercises: newList,
          hasMore: list.length >= 20,
          page: this.data.page + 1,
          loading: false
        });
      }
    } catch (err) {
      this.setData({ loading: false });
      showToast(err.message || '加载失败');
    }
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail, exercises: [], page: 1, hasMore: true });
    this.loadExercises();
  },

  onSearchClear() {
    this.setData({ searchKeyword: '', exercises: [], page: 1, hasMore: true });
    this.loadExercises();
  },

  onTabChange(e) {
    const tab = e.detail.name;
    this.setData({ currentTab: tab, currentBodyPart: tab === 'all' ? '' : tab, exercises: [], page: 1, hasMore: true });
    this.loadExercises();
  },

  onTypeFilter(e) {
    this.setData({ currentType: e.currentTarget.dataset.type, exercises: [], page: 1, hasMore: true });
    this.loadExercises();
  },

  onEquipmentFilter(e) {
    this.setData({ currentEquipment: e.currentTarget.dataset.equipment, exercises: [], page: 1, hasMore: true });
    this.loadExercises();
  },

  onToggleFilter() {
    this.setData({ showFilter: !this.data.showFilter });
  },

  onTapExercise(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/exercise/detail?id=${id}` });
  }
});
