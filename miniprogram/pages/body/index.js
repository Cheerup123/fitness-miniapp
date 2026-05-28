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
      // callFunction 直接返回 data 对象，不是 {code, data} 结构
      const data = await callFunction('body-stats', { days: 90 });
      console.log('body-stats data:', data);
      
      // 根据当前指标获取对应趋势数据
      let records = [];
      const metric = this.data.currentMetric;
      
      if (metric === 'weight' && data.weightTrend) {
        records = data.weightTrend.map(t => ({
          record_date: t.date,
          weight_kg: t.value,
          dateStr: util.formatDate(new Date(t.date))
        }));
      } else if (metric === 'body_fat' && data.fatTrend) {
        records = data.fatTrend.map(t => ({
          record_date: t.date,
          body_fat_pct: t.value,
          dateStr: util.formatDate(new Date(t.date))
        }));
      } else if (metric === 'muscle' && data.muscleTrend) {
        records = data.muscleTrend.map(t => ({
          record_date: t.date,
          muscle_mass_kg: t.value,
          dateStr: util.formatDate(new Date(t.date))
        }));
      } else if (metric === 'bmi') {
        // BMI 需要根据体重和身高计算，如果没有身高则无法计算
        records = []; // 暂时为空，需要后端支持
      }
      
      console.log('metric:', metric, 'records:', records);
      this.setData({
        records,
        latestRecord: data.latest || null,
        loading: false
      });
      this.buildChart(records);
    } catch (err) {
      this.setData({ loading: false });
      showToast(err.message || '加载失败');
    }
  },

  onMetricChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ currentMetric: key });
    this.loadData(); // 重新加载数据以获取对应指标的趋势
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

    // 单条数据时居中显示，多条数据时均匀分布
    let points = '';
    if (data.length === 1) {
      const x = w / 2;
      const y = h - padding - ((values[0] - min) / range) * (h - padding * 2);
      points = `${x},${y}`;
    } else {
      const stepX = (w - padding * 2) / (data.length - 1);
      points = data.map((d, i) => {
        const x = padding + i * stepX;
        const y = h - padding - ((values[i] - min) / range) * (h - padding * 2);
        return `${x},${y}`;
      }).join(' ');
    }

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
