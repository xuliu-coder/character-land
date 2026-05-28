// segmentation.js — 主体分割 + 手动裁剪 + 两段式流程协调

(function () {
  'use strict';

  // CDN 路径（在 index.html 中以 ESM 方式导入）
  var REMOVAL_CDN = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

  var removeBackgroundFn = null;
  var modelLoaded = false;
  var modelLoading = false;

  // ==================== 动态加载背景移除库 ====================

  function loadRemovalLibrary() {
    if (removeBackgroundFn) return Promise.resolve(removeBackgroundFn);
    if (modelLoading) {
      // 等待正在进行的加载
      return new Promise(function (resolve, reject) {
        var start = Date.now();
        var check = setInterval(function () {
          if (removeBackgroundFn) { clearInterval(check); resolve(removeBackgroundFn); }
          else if (Date.now() - start > 30000) { clearInterval(check); reject(new Error(window.App.t('error.modelTimeout'))); }
        }, 200);
      });
    }

    modelLoading = true;
    window.App.onSegProgress && window.App.onSegProgress({ stage: 'loading', message: window.App.t('seg.loading'), percent: 0 });

    return import(REMOVAL_CDN).then(function (mod) {
      removeBackgroundFn = mod.removeBackground;
      // 预加载模型
      if (mod.preload) {
        return mod.preload({ device: 'gpu' }).catch(function () {
          // GPU 预加载失败，尝试 CPU
          return mod.preload({ device: 'cpu' });
        }).then(function () {
          modelLoaded = true;
          modelLoading = false;
          return removeBackgroundFn;
        });
      }
      modelLoaded = true;
      modelLoading = false;
      return removeBackgroundFn;
    }).catch(function (err) {
      modelLoading = false;
      throw err;
    });
  }

  // ==================== 主体提取 ====================

  function extractSubject(imageBlob) {
    window.App.onSegProgress && window.App.onSegProgress({ stage: 'extracting', message: window.App.t('seg.extracting'), percent: 50 });

    return loadRemovalLibrary().then(function (removeBg) {
      return removeBg(imageBlob, {
        device: 'gpu',
        model: 'medium',
        output: { format: 'image/png', quality: 1.0 }
      }).catch(function () {
        // GPU 失败，降级 CPU 重试
        window.App.onSegProgress && window.App.onSegProgress({ stage: 'extracting', message: window.App.t('seg.cpuRetry'), percent: 50 });
        return removeBg(imageBlob, {
          device: 'cpu',
          model: 'medium',
          output: { format: 'image/png', quality: 1.0 }
        });
      });
    }).then(function (resultBlob) {
      // 裁剪透明边缘
      return cropToSubject(resultBlob);
    });
  }

  // ==================== 裁剪透明边缘 ====================

  function cropToSubject(imageBlob) {
    window.App.onSegProgress && window.App.onSegProgress({ stage: 'cropping', message: window.App.t('seg.cropping'), percent: 80 });

    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(imageBlob);

      img.onload = function () {
        URL.revokeObjectURL(url);

        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;

        // 查找非透明像素的边界
        var minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        var hasVisible = false;

        for (var y = 0; y < canvas.height; y++) {
          for (var x = 0; x < canvas.width; x++) {
            var alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) {
              hasVisible = true;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!hasVisible) {
          resolve(imageBlob);
          return;
        }

        // 添加一点 padding
        var pad = 10;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(canvas.width, maxX + pad);
        maxY = Math.min(canvas.height, maxY + pad);

        var cropW = maxX - minX;
        var cropH = maxY - minY;

        var cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        var cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        cropCanvas.toBlob(function (blob) {
          resolve(blob);
        }, 'image/png');
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error(window.App.t('error.imgLoadFailed')));
      };

      img.src = url;
    });
  }

  // ==================== 将 Blob 转为 DataURL ====================

  function blobToDataURL(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error(window.App.t('error.fileReadFailed'))); };
      reader.readAsDataURL(blob);
    });
  }

  // ==================== 手动裁剪 ====================

  function getManualCrop(imageDataURL) {
    return new Promise(function (resolve, reject) {
      // 存储回调，由裁剪弹窗调用
      window.App._cropResolve = resolve;
      window.App._cropReject = reject;
      window.App.showCropModal(imageDataURL);
    });
  }

  // ==================== 暴露API ====================

  window.App = window.App || {};
  window.App.segmentation = {
    extractSubject: extractSubject,
    cropToSubject: cropToSubject,
    blobToDataURL: blobToDataURL,
    getManualCrop: getManualCrop,
    isModelLoaded: function () { return modelLoaded; },
    loadModel: loadRemovalLibrary
  };

})();
