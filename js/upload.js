// upload.js — 图片上传处理 + 两段式生成流程

(function () {
  'use strict';

  // ==================== 缓存DOM ====================

  var uploadArea = document.getElementById('upload-area');
  var fileInput = document.getElementById('file-input');
  var fileName = document.getElementById('file-name');
  var generateBtn = document.getElementById('generate-btn');
  var previewContainer = document.getElementById('preview-container');
  var previewPlaceholder = document.getElementById('preview-placeholder');
  var previewActions = document.getElementById('preview-actions');
  var extractActions = document.getElementById('extract-actions');
  var segProgress = document.getElementById('seg-progress');
  var segProgressText = document.getElementById('seg-progress-text');
  var segProgressPct = document.getElementById('seg-progress-pct');
  var segProgressBar = document.getElementById('seg-progress-bar');
  var confirmExtractBtn = document.getElementById('confirm-extract-btn');
  var manualCropBtn = document.getElementById('manual-crop-btn');
  var reuploadBtn = document.getElementById('reupload-btn');

  // ==================== 状态 ====================

  var currentFile = null;
  var extractedBlob = null;       // Stage1 提取后的主体 Blob
  var extractedDataURL = null;    // Stage1 提取结果的 DataURL

  // ==================== 分割进度回调 ====================

  window.App.onSegProgress = function (info) {
    segProgress.classList.remove('hidden');
    segProgressText.textContent = info.message || '处理中...';
    segProgressPct.textContent = (info.percent || 0) + '%';
    segProgressBar.style.width = (info.percent || 0) + '%';
    if (info.percent >= 100) {
      setTimeout(function () { segProgress.classList.add('hidden'); }, 800);
    }
  };

  // ==================== 点击上传 ====================

  uploadArea.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file) handleFile(file);
  });

  // ==================== 拖拽上传 ====================

  uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('upload-area-drag-over');
  });

  uploadArea.addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('upload-area-drag-over');
  });

  uploadArea.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('upload-area-drag-over');
    var files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  // ==================== 文件处理 ====================

  var ALLOWED_TYPES = ['image/jpeg', 'image/png'];
  var MAX_SIZE = 5 * 1024 * 1024;

  function handleFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      window.App.showError('上传失败', '不支持的文件格式，请上传 JPG 或 PNG 格式的图片');
      fileInput.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      window.App.showError('上传失败', '图片大小超过 5MB 限制，请压缩后重新上传');
      fileInput.value = '';
      return;
    }

    resetState();
    currentFile = file;

    fileName.textContent = '已选择：' + file.name;
    fileName.classList.remove('hidden');

    generateBtn.disabled = false;
    showOriginalPreview(file);
  }

  function showOriginalPreview(file) {
    var reader = new FileReader();
    reader.onload = function (event) {
      previewPlaceholder.classList.add('hidden');
      previewContainer.innerHTML = '<img src="' + event.target.result + '" alt="上传图片预览" class="max-h-full max-w-full object-contain rounded">';
    };
    reader.readAsDataURL(file);
  }

  // ==================== 表单与参数 ====================

  var characterNameInput = document.getElementById('character-name');
  var pixelParams = document.getElementById('pixel-params');
  var confirmSaveBtn = document.getElementById('confirm-save-btn');
  var regenerateBtn = document.getElementById('regenerate-btn');
  var exportSingleBtn = document.getElementById('export-single-btn');

  var lastPixelResult = null;

  function getPixelOptions() {
    var pixelSizeSelect = document.getElementById('pixel-size');
    var colorCountSelect = document.getElementById('color-count');
    var symmetryToggle = document.getElementById('symmetry-toggle');
    var outlineToggle = document.getElementById('outline-toggle');
    return {
      pixelSize: pixelSizeSelect ? parseInt(pixelSizeSelect.value, 10) : 8,
      colorCount: colorCountSelect ? parseInt(colorCountSelect.value, 10) : 16,
      symmetry: symmetryToggle ? symmetryToggle.checked : true,
      outline: outlineToggle ? outlineToggle.checked : true
    };
  }

  // ==================== Stage 0: 触发生成 → 进入提取 ====================

  generateBtn.addEventListener('click', function () {
    var file = window.App.getCurrentFile();
    if (!file) {
      window.App.showError('生成失败', '请先上传角色图片');
      return;
    }

    var name = characterNameInput.value.trim();
    if (!name) {
      window.App.showError('生成失败', '请输入角色名称');
      characterNameInput.focus();
      return;
    }

    window.App.analytics.track('character_generate_start', {
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
      has_source: !!document.getElementById('character-source').value.trim(),
      has_description: !!document.getElementById('character-desc').value.trim()
    });

    doExtract(file);
  });

  function showExtractingState(msg) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span>识别中...';
    segProgress.classList.remove('hidden');
    segProgressText.textContent = msg || '正在识别角色主体...';
    segProgressPct.textContent = '0%';
    segProgressBar.style.width = '0%';
  }

  function hideExtractingState() {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '生成像素形象';
    segProgress.classList.add('hidden');
  }

  // ==================== Stage 1: 主体提取 ====================

  function doExtract(file) {
    showExtractingState('正在加载AI模型...');

    extractActions.classList.add('hidden');
    previewActions.classList.add('hidden');
    pixelParams.classList.add('hidden');

    window.App.segmentation.extractSubject(file)
      .then(function (resultBlob) {
        extractedBlob = resultBlob;
        return window.App.segmentation.blobToDataURL(resultBlob);
      })
      .then(function (dataURL) {
        extractedDataURL = dataURL;
        hideExtractingState();
        showExtractedPreview(dataURL);
      })
      .catch(function (err) {
        hideExtractingState();
        console.error('[Extract] 自动分割失败:', err);
        extractedBlob = null;
        extractedDataURL = null;

        // 兜底：显示选项
        showExtractFailOptions();
      });
  }

  function showExtractedPreview(dataURL) {
    previewPlaceholder.classList.add('hidden');
    // 用 Canvas 缩放提取结果，避免超大图片撑破预览区
    var img = new Image();
    img.onload = function () {
      var maxDim = 320;
      var w = img.width;
      var h = img.height;
      if (w > maxDim || h > maxDim) {
        var scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      var scaledDataURL = canvas.toDataURL('image/png');

      previewContainer.innerHTML = ''
        + '<div class="h-full flex items-center justify-center relative">'
        + '  <img src="' + scaledDataURL + '" alt="提取的角色主体" class="max-h-full max-w-full object-contain rounded">'
        + '  <span class="absolute top-1 left-1 bg-success text-white text-xs px-2 py-1 rounded-full">角色已识别</span>'
        + '</div>';
    };
    img.src = dataURL;

    extractActions.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '生成像素形象';
  }

  function showExtractFailOptions() {
    previewPlaceholder.classList.add('hidden');
    previewContainer.innerHTML = ''
      + '<div class="flex flex-col items-center justify-center h-full text-center space-y-3">'
      + '  <span class="text-2xl">🤔</span>'
      + '  <p class="text-secondary text-sm">自动识别未成功</p>'
      + '  <p class="text-xs text-disabled">请尝试手动框选角色区域，或重新上传图片</p>'
      + '</div>';

    extractActions.classList.remove('hidden');
    // 失败时隐藏"确认提取"按钮，显示手动和重新上传
    confirmExtractBtn.classList.add('hidden');
    manualCropBtn.classList.remove('hidden');
    reuploadBtn.classList.remove('hidden');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '生成像素形象';
  }

  // ==================== Stage 2: 像素化 ====================

  function doPixelate() {
    if (!extractedBlob) {
      window.App.showError('生成失败', '请先完成角色提取');
      return;
    }

    // 显示加载状态
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span>像素化中...';
    previewPlaceholder.classList.remove('hidden');
    previewPlaceholder.textContent = '正在生成像素形象...';
    previewContainer.innerHTML = '';
    previewContainer.appendChild(previewPlaceholder);
    extractActions.classList.add('hidden');

    // 将提取的 Blob 转为 DataURL，传给像素化管线
    window.App.segmentation.blobToDataURL(extractedBlob)
      .then(function (dataURL) {
        var options = getPixelOptions();
        return window.App.pixelate.generatePixelArt(dataURL, options);
      })
      .then(function (result) {
        // result = { dataURL, mode, outputSize, palette }
        displayPixelResult(result);
        generateBtn.disabled = false;
        generateBtn.innerHTML = '生成像素形象';
      })
      .catch(function (err) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '生成像素形象';
        previewPlaceholder.textContent = '上传图片后生成像素小人预览';

        window.App.analytics.track('character_generate_fail', {
          error_type: err && err.code === 'SUBJECT_TOO_SMALL' ? 'subject_too_small' : 'pixelate_error'
        });

        if (err && err.code === 'SUBJECT_TOO_SMALL') {
          // 复杂度检测失败：显示专用提示
          extractActions.classList.remove('hidden');
          confirmExtractBtn.classList.add('hidden');
          manualCropBtn.classList.remove('hidden');
          reuploadBtn.classList.remove('hidden');
          previewPlaceholder.classList.add('hidden');
          previewContainer.innerHTML = ''
            + '<div class="flex flex-col items-center justify-center h-full text-center space-y-3">'
            + '  <span class="text-2xl">🔍</span>'
            + '  <p class="text-sm text-error font-medium">' + err.message + '</p>'
            + '</div>';
        } else {
          window.App.showError('生成失败', '像素化处理出错，请重试', function () {
            doPixelate();
          });
          extractActions.classList.remove('hidden');
        }
      });
  }

  function displayPixelResult(result) {
    var dataURL = result.dataURL;

    // 最近邻放大到可见尺寸（从128放大到256）
    var previewImg = new Image();
    previewImg.onload = function () {
      var displaySize = 256;

      var scaleCanvas = document.createElement('canvas');
      scaleCanvas.width = displaySize;
      scaleCanvas.height = displaySize;
      var scaleCtx = scaleCanvas.getContext('2d');
      scaleCtx.imageSmoothingEnabled = false;
      scaleCtx.drawImage(previewImg, 0, 0, displaySize, displaySize);
      var previewDataURL = scaleCanvas.toDataURL('image/png');

      previewPlaceholder.classList.add('hidden');
      previewContainer.innerHTML = ''
        + '<div class="h-full flex items-center justify-center relative checkerboard-bg rounded overflow-hidden">'
        + '  <img src="' + previewDataURL + '" alt="像素小人预览" class="pixel-art" style="width:' + displaySize + 'px;height:' + displaySize + 'px">'
        + '</div>';

      previewActions.classList.remove('hidden');
      pixelParams.classList.remove('hidden');
    };
    previewImg.src = dataURL;

    lastPixelResult = dataURL;

    var options = getPixelOptions();
    window.App.analytics.track('character_generate_done', {
      pixel_size: options.pixelSize,
      color_count: options.colorCount,
      symmetry: options.symmetry,
      outline: options.outline,
      mode: result.mode || 'generic'
    });
  }

  // ==================== Stage1 按钮事件 ====================

  confirmExtractBtn.addEventListener('click', function () {
    doPixelate();
  });

  manualCropBtn.addEventListener('click', function () {
    // 读取原文件作为 DataURL 用于裁剪
    if (!currentFile) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      window.App.segmentation.getManualCrop(e.target.result).then(function (croppedDataURL) {
        // 将裁剪结果转为 Blob
        var canvas = document.createElement('canvas');
        var img = new Image();
        img.onload = function () {
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          canvas.toBlob(function (blob) {
            extractedBlob = blob;
            extractedDataURL = croppedDataURL;
            // 恢复确认提取按钮
            confirmExtractBtn.classList.remove('hidden');
            // 显示提取结果
            showExtractedPreview(croppedDataURL);
          }, 'image/png');
        };
        img.src = croppedDataURL;
      }).catch(function () {
        // 用户取消
      });
    };
    reader.readAsDataURL(currentFile);
  });

  reuploadBtn.addEventListener('click', function () {
    resetState();
    window.App.resetUpload();
    document.getElementById('character-name').value = '';
    document.getElementById('character-source').value = '';
    document.getElementById('character-desc').value = '';
    document.getElementById('character-quote').value = '';
  });

  // ==================== 重新生成 ====================

  regenerateBtn.addEventListener('click', function () {
    if (extractedBlob) {
      doPixelate();
    } else if (currentFile) {
      doExtract(currentFile);
    } else {
      window.App.showError('生成失败', '请先上传角色图片');
    }
  });

  // ==================== 确认保存 ====================

  confirmSaveBtn.addEventListener('click', function () {
    if (!lastPixelResult) {
      window.App.showError('保存失败', '没有可保存的像素形象');
      return;
    }

    var name = characterNameInput.value.trim();
    if (!name) {
      window.App.showError('保存失败', '角色名称不能为空');
      return;
    }

    var originalReader = new FileReader();
    originalReader.onload = function (e) {
      var options = getPixelOptions();
      var data = {
        name: name,
        source: document.getElementById('character-source').value.trim(),
        description: document.getElementById('character-desc').value.trim(),
        quote: document.getElementById('character-quote').value.trim(),
        originalImage: e.target.result,
        pixelImage: lastPixelResult,
        pixelSize: options.pixelSize,
        colorCount: options.colorCount,
        outline: options.outline
      };

      window.App.db.saveCharacter(data).then(function () {
        window.App.showSuccess('角色 "' + name + '" 已保存到角色库');
        window.App.analytics.track('character_save', {
          has_source: !!data.source,
          has_description: !!data.description,
          has_quote: !!data.quote,
          pixel_size: data.pixelSize,
          color_count: data.colorCount
        });
        resetState();
        window.App.resetUpload();
        document.getElementById('character-name').value = '';
        document.getElementById('character-source').value = '';
        document.getElementById('character-desc').value = '';
        document.getElementById('character-quote').value = '';
      }).catch(function (err) {
        window.App.showError('保存失败', err.message || '数据存储出错，请重试');
      });
    };
    originalReader.readAsDataURL(currentFile);
  });

  // ==================== 导出单角色 ====================

  exportSingleBtn.addEventListener('click', function () {
    if (!lastPixelResult) {
      window.App.showError('导出失败', '没有可导出的像素形象');
      return;
    }
    window.App.analytics.track('character_export');
    var link = document.createElement('a');
    link.download = 'character-pixel-' + Date.now() + '.png';
    link.href = lastPixelResult;
    link.click();
    window.App.showSuccess('单角色图片已导出');
  });

  // ==================== 手动裁剪弹窗 ====================

  var cropModal = document.getElementById('crop-modal');
  var cropCanvas = document.getElementById('crop-canvas');
  var cropContainer = document.getElementById('crop-container');
  var cropConfirmBtn = document.getElementById('crop-confirm-btn');
  var cropCancelBtn = document.getElementById('crop-cancel-btn');
  var cropCtx = cropCanvas.getContext('2d');

  var cropImage = null;
  var cropRect = null; // { x, y, w, h }
  var isDrawing = false;
  var drawStartX = 0, drawStartY = 0;

  window.App.showCropModal = function (imageDataURL) {
    cropImage = new Image();
    cropImage.onload = function () {
      var maxW = window.innerWidth * 0.85;
      var maxH = window.innerHeight * 0.55;
      var scale = Math.min(maxW / cropImage.width, maxH / cropImage.height, 1);
      cropCanvas.width = cropImage.width * scale;
      cropCanvas.height = cropImage.height * scale;
      cropCtx.drawImage(cropImage, 0, 0, cropCanvas.width, cropCanvas.height);
      cropRect = null;
      cropModal.classList.remove('hidden');
    };
    cropImage.src = imageDataURL;
  };

  function closeCropModal(cancelled) {
    cropModal.classList.add('hidden');
    if (cancelled && window.App._cropReject) {
      window.App._cropReject(new Error('用户取消裁剪'));
    }
    cropRect = null;
    cropImage = null;
  }

  cropCancelBtn.addEventListener('click', function () { closeCropModal(true); });
  cropModal.addEventListener('click', function (e) {
    if (e.target === cropModal) closeCropModal(true);
  });

  cropCanvas.addEventListener('mousedown', function (e) {
    var rect = cropCanvas.getBoundingClientRect();
    drawStartX = e.clientX - rect.left;
    drawStartY = e.clientY - rect.top;
    isDrawing = true;
    cropRect = { x: drawStartX, y: drawStartY, w: 0, h: 0 };
  });

  cropCanvas.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    var rect = cropCanvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    cropRect.x = Math.min(drawStartX, mx);
    cropRect.y = Math.min(drawStartY, my);
    cropRect.w = Math.abs(mx - drawStartX);
    cropRect.h = Math.abs(my - drawStartY);

    // 重绘
    cropCtx.drawImage(cropImage, 0, 0, cropCanvas.width, cropCanvas.height);
    cropCtx.strokeStyle = '#212121';
    cropCtx.lineWidth = 2;
    cropCtx.setLineDash([4, 2]);
    cropCtx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    cropCtx.setLineDash([]);
  });

  cropCanvas.addEventListener('mouseup', function () {
    isDrawing = false;
  });

  cropConfirmBtn.addEventListener('click', function () {
    if (!cropRect || cropRect.w < 10 || cropRect.h < 10) {
      window.App.showError('裁剪失败', '请拖拽框选更大的区域');
      return;
    }

    // 从原图裁剪
    var scaleX = cropImage.width / cropCanvas.width;
    var scaleY = cropImage.height / cropCanvas.height;
    var sx = cropRect.x * scaleX;
    var sy = cropRect.y * scaleY;
    var sw = cropRect.w * scaleX;
    var sh = cropRect.h * scaleY;

    var resultCanvas = document.createElement('canvas');
    resultCanvas.width = sw;
    resultCanvas.height = sh;
    var resultCtx = resultCanvas.getContext('2d');
    resultCtx.drawImage(cropImage, sx, sy, sw, sh, 0, 0, sw, sh);

    var dataURL = resultCanvas.toDataURL('image/png');

    closeCropModal(false);
    if (window.App._cropResolve) {
      window.App._cropResolve(dataURL);
    }
  });

  // 修复：mouseup 绑定到 document
  document.addEventListener('mouseup', function () {
    if (isDrawing) {
      isDrawing = false;
    }
  });

  // ==================== 状态重置 ====================

  function resetState() {
    extractedBlob = null;
    extractedDataURL = null;
    lastPixelResult = null;
    extractActions.classList.add('hidden');
    confirmExtractBtn.classList.remove('hidden');
    manualCropBtn.classList.remove('hidden');
    reuploadBtn.classList.remove('hidden');
    segProgress.classList.add('hidden');
    generateBtn.innerHTML = '生成像素形象';
    generateBtn.disabled = true;
  }

  // ==================== 暴露API ====================

  window.App.getCurrentFile = function () { return currentFile; };
  window.App.getLastPixelResult = function () { return lastPixelResult; };

  window.App.resetUpload = function () {
    currentFile = null;
    extractedBlob = null;
    extractedDataURL = null;
    fileInput.value = '';
    fileName.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '生成像素形象';
    previewContainer.innerHTML = '';
    previewContainer.appendChild(previewPlaceholder);
    previewPlaceholder.classList.remove('hidden');
    previewActions.classList.add('hidden');
    pixelParams.classList.add('hidden');
    extractActions.classList.add('hidden');
    segProgress.classList.add('hidden');
    lastPixelResult = null;
    confirmExtractBtn.classList.remove('hidden');
  };

})();
