// analytics.js — GA4 数据埋点模块
// 用法：window.App.analytics.track('event_name', { key: 'value' })

(function () {
  'use strict';

  /**
   * 安全上报事件（即使 gtag 未加载也不会报错）
   * @param {string} eventName - 事件名称，使用 snake_case
   * @param {object} [params]  - 事件参数
   */
  function track(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  /**
   * SPA 页面浏览追踪（Tab 切换时调用）
   * @param {string} pageTitle - 页面标题
   */
  function trackPageView(pageTitle) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href
      });
    }
  }

  window.App.analytics = {
    track: track,
    trackPageView: trackPageView
  };

})();
