const { callFunction, showToast } = require('../../utils/request');
const util = require('../../utils/util');

Page({
  data: {
    currentMetric: 'weight',
    records: [],
    chartData: [],
    latestRecord: null,
    loading: true,
    metrics: [
      { key: 'weight', label: '体重', unit: 'kg' },
      { key: 'body_fat', label: '体脂率', unit: '%' },
      { key: 'muscle', label: '肌肉量', unit: 'kg' },
      { key: 'bmi', label: 'BMI', unit: '' }
    ],
    // 图表
    chartPoints: '',
    chartLabels: [],
    chartValues: [],
    maxValue: 0,
    minValue: 0,
    chartWidth: 680,
    chartHeight: 300
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res = await callFunction('body-stats', { days: 90 });
      if (res) {
        const records = (res.records || []).map(r => ({
          ...r,
          dateStr: util.formatDate(new Date(r.record_date))
        }));
        this.setData({
          records,
          latestRecord: records.length > 0 ? records[records.length - 1] : null,
          loading: false
        });
        this.buildChart(records);
      }
    } catch (err) {
      this.setData({ loading: false });
      showToast(err.message || '加载失败');
    }
  },

  onMetricChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ currentMetric: key });
    this.buildChart(this.data.records);
  },

  buildChart(records) {
    if (!records || records.length === 0) {
      this.setData({ chartPoints: '', chartLabels: [], chartValues: [] });
      return;
    }

    const metricKey = this.data.currentMetric === 'body_fat' ? 'body_fat_pct' :
                      this.data.currentMetric === 'muscle' ? 'muscle_mass_kg' :
                      this.data.currentMetric === 'weight' ? 'weight_kg' : 'bmi';

    const data = records.filter(r => r[metricKey] != null).slice(-14); // 最近14条
    if (data.length === 0) {
      this.setData({ chartPoints: '', chartLabels: [], chartValues: [] });
      return;
    }

    const values = data.map(d => parseFloat(d[metricKey]));
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const padding = 40;
    const w = this.data.chartWidth;
    const h = this.data.chartHeight;
    const stepX = data.length > 1 ? (w - padding * 2) / (data.length - 1) : 0;

    const points = data.map((d, i) => {
      const x = padding + i * stepX;
      const y = h - padding - ((values[i] - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    this.setData({
      chartPoints: points,
      chartLabels: data.map(d => d.dateStr.slice(5)), // MM-DD
      chartValues: values,
      maxValue: max,
      minValue: min
    });
  },

  goRecord() {
    wx.navigateTo({ url: '/pages/body/record' });
  }
});
