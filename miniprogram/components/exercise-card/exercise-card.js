const util = require('../../utils/util');

Component({
  properties: {
    exercise: {
      type: Object,
      value: {}
    },
    showArrow: {
      type: Boolean,
      value: true
    },
    showSets: {
      type: Boolean,
      value: false
    }
  },

  computed: {},

  data: {
    typeLabel: '',
    difficultyLabel: '',
    equipmentLabel: ''
  },

  observers: {
    'exercise': function (exercise) {
      if (!exercise) return;
      this.setData({
        typeLabel: util.getTypeLabel(exercise.exercise_type),
        difficultyLabel: util.getDifficultyLabel(exercise.difficulty),
        equipmentLabel: util.getEquipmentLabel(exercise.equipment)
      });
    }
  },

  methods: {
    onTap() {
      const { exercise } = this.properties;
      if (exercise && exercise.id) {
        this.triggerEvent('tap', { exercise });
        wx.navigateTo({
          url: `/pages/exercise/detail?id=${exercise.id}`
        });
      }
    }
  }
});
