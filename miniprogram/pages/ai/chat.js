const { callFunction, showToast } = require('../../utils/request');

Page({
  data: {
    sessionId: null,
    messages: [],
    inputText: '',
    loading: false,
    scrollTop: 0,
    showDateHeader: false,
    dateHeader: '',
    userAvatar: ''
  },

  onLoad(options) {
    if (options.sessionId) {
      this.setData({ sessionId: parseInt(options.sessionId) });
      this.loadHistory();
    }
    this.setUserAvatar();
  },

  setUserAvatar() {
    const userInfo = getApp().globalData.userInfo;
    if (userInfo && userInfo.nickname) {
      this.setData({ userAvatar: userInfo.nickname.substring(0, 1).toUpperCase() });
    } else {
      this.setData({ userAvatar: 'U' });
    }
  },

  async loadHistory() {
    if (!this.data.sessionId) return;

    try {
      const result = await callFunction('ai-chat-history', {
        sessionId: this.data.sessionId,
        page: 1,
        pageSize: 50
      });

      if (result && result.messages) {
        const messages = result.messages.map(m => ({
          ...m,
          timeStr: this.formatTime(m.created_at)
        }));
        this.setData({ messages });
        this.scrollToBottom();
      }
    } catch (err) {
      console.error('加载历史失败:', err);
    }
  },

  formatTime(dateInput) {
    if (!dateInput) return '';
    let date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput.replace(/-/g, '/'));
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  async onSend() {
    const text = this.data.inputText.trim();
    if (!text || this.data.loading) return;

    this.setData({ inputText: '', loading: true });

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timeStr: this.formatTime(new Date().toISOString())
    };

    this.setData({
      messages: [...this.data.messages, userMsg]
    });
    this.scrollToBottom();

    try {
      const result = await callFunction('ai-chat-send', {
        message: text,
        sessionId: this.data.sessionId,
        sessionType: 'chat'
      });

      if (result) {
        if (!this.data.sessionId && result.sessionId) {
          this.setData({ sessionId: result.sessionId });
        }

        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.response,
          timeStr: this.formatTime(new Date())
        };

        this.setData({
          messages: [...this.data.messages, assistantMsg]
        });
        this.scrollToBottom();
      } else {
        showToast(result.message || '发送失败');
      }
    } catch (err) {
      showToast(err.message || '发送失败');
      const failedMsg = this.data.messages.find(m => m.id === userMsg.id);
      if (failedMsg) {
        failedMsg.content = '发送失败，请重试';
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  onQuickTap(e) {
    const question = e.currentTarget.dataset.q;
    this.setData({ inputText: question });
    this.onSend();
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTop: 999999 });
    }, 100);
  },

  loadMore() {
  }
});
