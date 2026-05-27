/**
 * 云函数调用封装
 */

function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success(res) {
        const result = res.result;
        if (result.code === 0) {
          resolve(result.data);
        } else {
          const err = new Error(result.message || '请求失败');
          err.code = result.code;
          reject(err);
        }
      },
      fail(err) {
        console.error(`云函数 ${name} 调用失败:`, err);
        reject(new Error('网络请求失败，请重试'));
      }
    });
  });
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

function hideLoading() {
  wx.hideLoading();
}

function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 });
}

function showError(message) {
  wx.showToast({
    title: message || '操作失败',
    icon: 'error',
    duration: 2000
  });
}

async function requestWithLoading(name, data = {}, loadingText = '加载中...') {
  showLoading(loadingText);
  try {
    const result = await callFunction(name, data);
    hideLoading();
    return result;
  } catch (err) {
    hideLoading();
    showError(err.message);
    throw err;
  }
}

module.exports = {
  callFunction,
  showLoading,
  hideLoading,
  showToast,
  showError,
  requestWithLoading
};
