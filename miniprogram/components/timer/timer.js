Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    defaultSeconds: {
      type: Number,
      value: 60
    }
  },

  data: {
    totalSeconds: 60,
    remainingSeconds: 60,
    running: false,
    displayMinutes: '00',
    displaySeconds: '00',
    progressPercent: 100,
    presets: [30, 45, 60, 90, 120],
    timer: null
  },

  observers: {
    'visible': function (visible) {
      if (visible) {
        this.setData({ totalSeconds: this.properties.defaultSeconds });
        this.resetTimer();
      } else {
        this.stopTimer();
      }
    },
    'defaultSeconds': function (val) {
      if (this.properties.visible) {
        this.setData({ totalSeconds: val });
        this.resetTimer();
      }
    }
  },

  lifetimes: {
    detached() {
      this.stopTimer();
    }
  },

  methods: {
    updateDisplay() {
      const { remainingSeconds, totalSeconds } = this.data;
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

      this.setData({
        displayMinutes: String(minutes).padStart(2, '0'),
        displaySeconds: String(seconds).padStart(2, '0'),
        progressPercent: progress
      });
    },

    startTimer() {
      if (this.data.running) return;
      this.setData({ running: true });

      this.data.timer = setInterval(() => {
        let remaining = this.data.remainingSeconds - 1;
        if (remaining <= 0) {
          remaining = 0;
          this.stopTimer();
          // 震动反馈
          wx.vibrateShort({ type: 'heavy' });
          this.triggerEvent('complete');
        }
        this.setData({ remainingSeconds: remaining });
        this.updateDisplay();
      }, 1000);
    },

    stopTimer() {
      if (this.data.timer) {
        clearInterval(this.data.timer);
        this.data.timer = null;
      }
      this.setData({ running: false });
    },

    resetTimer() {
      this.stopTimer();
      this.setData({ remainingSeconds: this.data.totalSeconds });
      this.updateDisplay();
    },

    onToggle() {
      if (this.data.running) {
        this.stopTimer();
      } else {
        this.startTimer();
      }
    },

    onReset() {
      this.resetTimer();
    },

    onSkip() {
      this.stopTimer();
      this.triggerEvent('complete');
      this.triggerEvent('close');
    },

    onClose() {
      this.stopTimer();
      this.triggerEvent('close');
    },

    onPreset(e) {
      const seconds = e.currentTarget.dataset.seconds;
      this.setData({ totalSeconds: seconds });
      this.resetTimer();
    }
  }
});
