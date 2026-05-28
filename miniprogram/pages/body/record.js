const { callFunction, showToast, requestWithLoading } = require('../../utils/request');
const util = require('../../utils/util');

Page({
  data: {
    recordDate: '',
    pickerDate: new Date().getTime(),
    maxDate: new Date().getTime(),
    showDatePicker: false,
    weight: '',
    bodyFat: '',
    muscleMass: '',
    bmi: '',
    chest: '',
    waist: '',
    hip: '',
    leftArm: '',
    rightArm: '',
    leftThigh: '',
    rightThigh: '',
    note: '',
    showBodyParts: false
  },

  onLoad() {
    const now = new Date();
    this.setData({
      recordDate: util.formatDate(now),
      pickerDate: now.getTime(),
      maxDate: now.getTime()
    });
  },

  onShowDatePicker() {
    this.setData({ showDatePicker: true });
  },

  onCloseDatePicker() {
    this.setData({ showDatePicker: false });
  },

  onDateConfirm(e) {
    const date = new Date(e.detail);
    this.setData({
      recordDate: util.formatDate(date),
      pickerDate: e.detail,
      showDatePicker: false
    });
  },

  onWeightInput(e) {
    const weight = e.detail;
    this.setData({ weight });
    // 自动计算 BMI
    if (weight && getApp().globalData.userInfo?.height_cm) {
      const heightM = getApp().globalData.userInfo.height_cm / 100;
      const bmi = (parseFloat(weight) / (heightM * heightM)).toFixed(1);
      this.setData({ bmi });
    }
  },

  onBodyFatInput(e) { this.setData({ bodyFat: e.detail }); },
  onMuscleMassInput(e) { this.setData({ muscleMass: e.detail }); },
  onChestInput(e) { this.setData({ chest: e.detail }); },
  onWaistInput(e) { this.setData({ waist: e.detail }); },
  onHipInput(e) { this.setData({ hip: e.detail }); },
  onLeftArmInput(e) { this.setData({ leftArm: e.detail }); },
  onRightArmInput(e) { this.setData({ rightArm: e.detail }); },
  onLeftThighInput(e) { this.setData({ leftThigh: e.detail }); },
  onRightThighInput(e) { this.setData({ rightThigh: e.detail }); },
  onNoteInput(e) { this.setData({ note: e.detail }); },

  onToggleBodyParts() {
    this.setData({ showBodyParts: !this.data.showBodyParts });
  },

  async onSubmit() {
    const { recordDate, weight, bodyFat, muscleMass, bmi,
            chest, waist, hip, leftArm, rightArm, leftThigh, rightThigh, note } = this.data;

    if (!weight && !bodyFat && !muscleMass) {
      showToast('请至少填写一项数据');
      return;
    }

    try {
      await requestWithLoading('body-record', {
        recordDate,
        weightKg: parseFloat(weight) || null,
        bodyFatPct: parseFloat(bodyFat) || null,
        muscleMassKg: parseFloat(muscleMass) || null,
        bmi: parseFloat(bmi) || null,
        chestCm: parseFloat(chest) || null,
        waistCm: parseFloat(waist) || null,
        hipCm: parseFloat(hip) || null,
        leftArmCm: parseFloat(leftArm) || null,
        rightArmCm: parseFloat(rightArm) || null,
        leftThighCm: parseFloat(leftThigh) || null,
        rightThighCm: parseFloat(rightThigh) || null,
        note: note || null
      }, '保存中...');

      showToast('记录成功 ✅');
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      showToast(err.message || '保存失败');
    }
  }
});
