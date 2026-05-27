// ui.js — UI辅助（弹窗、提示等）

(function () {
  'use strict';

  // ==================== 缓存DOM ====================

  var errorModal = document.getElementById('error-modal');
  var errorTitle = document.getElementById('error-title');
  var errorMessage = document.getElementById('error-message');
  var errorCloseBtn = document.getElementById('error-close-btn');
  var errorRetryBtn = document.getElementById('error-retry-btn');

  var successModal = document.getElementById('success-modal');
  var successMessage = document.getElementById('success-message');
  var successCloseBtn = document.getElementById('success-close-btn');

  // ==================== 错误弹窗 ====================

  // 全局重试回调
  var retryCallback = null;

  function showError(title, message, onRetry) {
    errorTitle.textContent = title || '操作失败';
    errorMessage.textContent = message || '发生未知错误，请重试';
    retryCallback = onRetry || null;

    if (retryCallback) {
      errorRetryBtn.classList.remove('hidden');
    } else {
      errorRetryBtn.classList.add('hidden');
    }

    errorModal.classList.remove('hidden');
  }

  function hideError() {
    errorModal.classList.add('hidden');
    retryCallback = null;
  }

  errorCloseBtn.addEventListener('click', hideError);

  errorRetryBtn.addEventListener('click', function () {
    hideError();
    if (typeof retryCallback === 'function') {
      retryCallback();
    }
  });

  errorModal.addEventListener('click', function (e) {
    if (e.target === errorModal) {
      hideError();
    }
  });

  // ESC 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!errorModal.classList.contains('hidden')) {
        hideError();
      }
      if (!successModal.classList.contains('hidden')) {
        hideSuccess();
      }
    }
  });

  // ==================== 成功弹窗 ====================

  function showSuccess(message) {
    successMessage.textContent = message || '操作成功';
    successModal.classList.remove('hidden');
  }

  function hideSuccess() {
    successModal.classList.add('hidden');
  }

  successCloseBtn.addEventListener('click', hideSuccess);

  successModal.addEventListener('click', function (e) {
    if (e.target === successModal) {
      hideSuccess();
    }
  });

  // ==================== 暴露API ====================

  window.App = window.App || {};
  window.App.showError = showError;
  window.App.showSuccess = showSuccess;

})();
