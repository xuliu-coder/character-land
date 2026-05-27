// pixel-templates.js — Q版模板系统
// 48×48 二头身像素画模板：模板模式 + 通用模式

(function () {
  'use strict';

  var SIZE = 48;
  var ALPHA_THRESHOLD = 10;

  // ==================== 模板形状定义 ====================

  // 头部椭圆区域（圆心 x, y, rx, ry）
  var HEAD_CX = 24, HEAD_CY = 16, HEAD_RX = 9, HEAD_RY = 10;

  // 身体矩形区域
  var BODY_X1 = 17, BODY_Y1 = 27, BODY_X2 = 31, BODY_Y2 = 36;

  // 手臂
  var ARM_LEFT_X1 = 13, ARM_LEFT_X2 = 16, ARM_Y1 = 27, ARM_Y2 = 33;
  var ARM_RIGHT_X1 = 32, ARM_RIGHT_X2 = 35, ARM_Y1 = 27, ARM_Y2 = 33;

  // 腿
  var LEG_LEFT_X1 = 17, LEG_LEFT_X2 = 21, LEG_Y1 = 37, LEG_Y2 = 46;
  var LEG_RIGHT_X1 = 26, LEG_RIGHT_X2 = 30, LEG_Y1 = 37, LEG_Y2 = 46;

  // ==================== 颜色提取 ====================

  function extractColors(imageData) {
    var data = imageData.data;
    var w = imageData.width;
    var h = imageData.height;
    var bounds = getSubjectBounds(imageData);

    if (!bounds.hasVisible) {
      return getDefaultColors();
    }

    // 将主体区域划分为几个水平带采样
    var top = bounds.minY;
    var bot = bounds.maxY;
    var mid = (top + bot) / 2;
    var height = Math.max(1, bot - top);

    // 采样区域（在主体范围内按比例划分）
    var hairTop = top;
    var hairBot = Math.round(top + height * 0.2);

    var faceTop = Math.round(top + height * 0.15);
    var faceBot = Math.round(top + height * 0.4);

    var bodyTop = Math.round(top + height * 0.45);
    var bodyBot = Math.round(top + height * 0.75);

    var hairColor = sampleRegion(data, w, h, bounds, hairTop, hairBot) || { r: 60, g: 40, b: 20 };
    var skinColor = sampleRegion(data, w, h, bounds, faceTop, faceBot) || { r: 255, g: 220, b: 180 };
    var clothColor = sampleRegion(data, w, h, bounds, bodyTop, bodyBot) || { r: 80, g: 120, b: 200 };

    // 从肤色推导阴影色
    var shadowColor = {
      r: Math.round(skinColor.r * 0.75),
      g: Math.round(skinColor.g * 0.75),
      b: Math.round(skinColor.b * 0.75)
    };

    return {
      hair: hairColor,
      skin: skinColor,
      cloth: clothColor,
      shadow: shadowColor,
      outline: { r: 0, g: 0, b: 0 },
      eye: { r: 20, g: 20, b: 20 },
      mouth: { r: 180, g: 80, b: 80 },
      cheek: { r: Math.min(255, skinColor.r + 40), g: Math.min(255, skinColor.g - 20), b: Math.min(255, skinColor.b - 20) }
    };
  }

  function sampleRegion(data, w, h, bounds, yStart, yEnd) {
    var r = 0, g = 0, b = 0, count = 0;
    var xStart = Math.max(0, bounds.minX);
    var xEnd = Math.min(w - 1, bounds.maxX);
    var ys = Math.max(0, Math.round(yStart));
    var ye = Math.min(h - 1, Math.round(yEnd));

    for (var y = ys; y <= ye; y++) {
      for (var x = xStart; x <= xEnd; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] > ALPHA_THRESHOLD) {
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
    }

    if (count === 0) return null;
    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count)
    };
  }

  function getDefaultColors() {
    return {
      hair: { r: 40, g: 30, b: 20 },
      skin: { r: 255, g: 220, b: 180 },
      cloth: { r: 80, g: 120, b: 200 },
      shadow: { r: 190, g: 165, b: 135 },
      outline: { r: 0, g: 0, b: 0 },
      eye: { r: 20, g: 20, b: 20 },
      mouth: { r: 200, g: 80, b: 80 },
      cheek: { r: 255, g: 180, b: 160 }
    };
  }

  function getSubjectBounds(imageData) {
    var data = imageData.data;
    var w = imageData.width;
    var h = imageData.height;
    var minX = w, minY = h, maxX = 0, maxY = 0;
    var hasVisible = false;
    var visibleCount = 0;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] > ALPHA_THRESHOLD) {
          hasVisible = true;
          visibleCount++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    return {
      minX: minX, minY: minY, maxX: maxX, maxY: maxY,
      hasVisible: hasVisible,
      visibleRatio: hasVisible ? visibleCount / (w * h) : 0
    };
  }

  // ==================== 模板适用性判断 ====================

  function isTemplateSuitable(imageData) {
    var bounds = getSubjectBounds(imageData);

    if (!bounds.hasVisible) return false;
    if (bounds.visibleRatio < 0.05) return false;

    var bbW = bounds.maxX - bounds.minX + 1;
    var bbH = bounds.maxY - bounds.minY + 1;

    // 主体应大致是竖向的（人形比例）
    var aspectRatio = bbH / Math.max(1, bbW);
    if (aspectRatio < 1.2 || aspectRatio > 5.0) return false;

    // 检查颜色复杂度
    var data = imageData.data;
    var w = imageData.width;
    var h = imageData.height;
    var colorSet = {};
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] > ALPHA_THRESHOLD) {
        colorSet[Math.round(data[i] / 16) + ',' + Math.round(data[i + 1] / 16) + ',' + Math.round(data[i + 2] / 16)] = true;
      }
    }

    // 颜色种类太多 → 可能不是简洁的角色图
    if (Object.keys(colorSet).length > 300) return false;

    return true;
  }

  // ==================== 模板渲染 ====================

  function renderTemplate(imageData) {
    var colors = extractColors(imageData);
    var canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    var ctx = canvas.getContext('2d');
    var outData = ctx.createImageData(SIZE, SIZE);
    var d = outData.data;

    // 绘制身体各部分
    drawHair(d, colors);
    drawHead(d, colors);
    drawEyes(d, colors);
    drawMouth(d, colors);
    drawCheeks(d, colors);
    drawBody(d, colors);
    drawArms(d, colors);
    drawLegs(d, colors);

    // 应用硬边轮廓
    var outlined = window.App.pixelUtils.applyOutline(outData);
    // 清理孤立像素
    var cleaned = window.App.pixelUtils.removeIsolatedPixels(outlined, 1);

    ctx.putImageData(cleaned, 0, 0);
    return canvas.toDataURL('image/png');
  }

  // ---- 身体部件绘制函数 (48×48) ----

  function inEllipse(x, y, cx, cy, rx, ry) {
    var dx = (x - cx) / rx;
    var dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function setPixel(d, x, y, color, alpha) {
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
    var idx = (y * SIZE + x) * 4;
    d[idx] = color.r;
    d[idx + 1] = color.g;
    d[idx + 2] = color.b;
    d[idx + 3] = (alpha !== undefined) ? alpha : 255;
  }

  function drawHead(d, colors) {
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        if (inEllipse(x, y, HEAD_CX, HEAD_CY, HEAD_RX, HEAD_RY)) {
          // 脸部高光（左上方偏亮）
          var distFromCenter = Math.sqrt(Math.pow((x - HEAD_CX) / HEAD_RX, 2) + Math.pow((y - HEAD_CY) / HEAD_RY, 2));
          var highlight = (x < HEAD_CX && y < HEAD_CY) ? 1.08 : 1.0;
          var r = Math.min(255, Math.round(colors.skin.r * highlight));
          var g = Math.min(255, Math.round(colors.skin.g * highlight));
          var b = Math.min(255, Math.round(colors.skin.b * highlight));
          setPixel(d, x, y, { r: r, g: g, b: b });
        }
      }
    }
  }

  function drawHair(d, colors) {
    // 头发覆盖头部上方和两侧
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        if (!inEllipse(x, y, HEAD_CX, HEAD_CY, HEAD_RX, HEAD_RY)) continue;

        // 刘海区域：头部上1/3 + 两侧
        var inHairZone = y < HEAD_CY - HEAD_RY * 0.15;
        var inSideZone = (x < HEAD_CX - HEAD_RX * 0.55 || x > HEAD_CX + HEAD_RX * 0.55) && y < HEAD_CY + HEAD_RY * 0.1;

        if (inHairZone || inSideZone) {
          // 刘海锯齿效果
          var hairEdge = HEAD_CY - HEAD_RY * 0.3;
          if (inHairZone || y < hairEdge + (x % 3)) {
            setPixel(d, x, y, colors.hair);
          }
        }

        // 头顶发量
        if (y < HEAD_CY - HEAD_RY * 0.5) {
          setPixel(d, x, y, colors.hair);
        }
      }
    }
  }

  function drawEyes(d, colors) {
    // 眼睛：两个小椭圆或矩形
    var eyeY = Math.round(HEAD_CY + HEAD_RY * 0.15);
    var leftEyeX = Math.round(HEAD_CX - HEAD_RX * 0.4);
    var rightEyeX = Math.round(HEAD_CX + HEAD_RX * 0.4);

    for (var y = eyeY - 1; y <= eyeY + 1; y++) {
      for (var x = leftEyeX - 2; x <= leftEyeX + 1; x++) {
        if (inEllipse(x, y, leftEyeX, eyeY, 2.5, 1.8)) {
          setPixel(d, x, y, colors.eye);
        }
      }
      for (var x = rightEyeX - 1; x <= rightEyeX + 2; x++) {
        if (inEllipse(x, y, rightEyeX, eyeY, 2.5, 1.8)) {
          setPixel(d, x, y, colors.eye);
        }
      }
    }

    // 眼睛高光（白色小点）
    setPixel(d, leftEyeX - 1, eyeY - 1, { r: 255, g: 255, b: 255 });
    setPixel(d, rightEyeX + 1, eyeY - 1, { r: 255, g: 255, b: 255 });
  }

  function drawMouth(d, colors) {
    var mouthY = Math.round(HEAD_CY + HEAD_RY * 0.45);
    var mouthX = HEAD_CX;

    // 小弧线嘴巴
    setPixel(d, mouthX - 1, mouthY, colors.mouth);
    setPixel(d, mouthX, mouthY, colors.mouth);
    setPixel(d, mouthX + 1, mouthY, colors.mouth);
    setPixel(d, mouthX, mouthY + 1, colors.mouth);
  }

  function drawCheeks(d, colors) {
    var cheekY = Math.round(HEAD_CY + HEAD_RY * 0.2);
    var leftCheekX = Math.round(HEAD_CX - HEAD_RX * 0.75);
    var rightCheekX = Math.round(HEAD_CX + HEAD_RX * 0.75);

    // 淡淡的腮红
    setPixel(d, leftCheekX, cheekY, colors.cheek);
    setPixel(d, leftCheekX + 1, cheekY, colors.cheek);
    setPixel(d, rightCheekX - 1, cheekY, colors.cheek);
    setPixel(d, rightCheekX, cheekY, colors.cheek);
  }

  function drawBody(d, colors) {
    for (var y = BODY_Y1; y <= BODY_Y2; y++) {
      for (var x = BODY_X1; x <= BODY_X2; x++) {
        // 躯干呈微梯形（上窄下宽）
        var midY = (BODY_Y1 + BODY_Y2) / 2;
        var taper = 0.5 + 0.5 * (y - BODY_Y1) / (BODY_Y2 - BODY_Y1);
        var midX = (BODY_X1 + BODY_X2) / 2;
        var halfW = ((BODY_X2 - BODY_X1) / 2) * (0.85 + 0.15 * taper);
        if (Math.abs(x - midX) <= halfW) {
          setPixel(d, x, y, colors.cloth);
        }
      }
    }
  }

  function drawArms(d, colors) {
    // 左臂
    for (var y = ARM_Y1; y <= ARM_Y2; y++) {
      for (var x = ARM_LEFT_X1; x <= ARM_LEFT_X2; x++) {
        setPixel(d, x, y, colors.cloth);
      }
    }
    // 左手（肤色小圆）
    var handLX = ARM_LEFT_X1 + 1;
    var handLY = ARM_Y2 + 1;
    for (var y = handLY - 1; y <= handLY + 1; y++) {
      for (var x = handLX - 1; x <= handLX + 1; x++) {
        setPixel(d, x, y, colors.skin);
      }
    }

    // 右臂
    for (var y = ARM_Y1; y <= ARM_Y2; y++) {
      for (var x = ARM_RIGHT_X1; x <= ARM_RIGHT_X2; x++) {
        setPixel(d, x, y, colors.cloth);
      }
    }
    // 右手
    var handRX = ARM_RIGHT_X2 - 1;
    var handRY = ARM_Y2 + 1;
    for (var y = handRY - 1; y <= handRY + 1; y++) {
      for (var x = handRX - 1; x <= handRX + 1; x++) {
        setPixel(d, x, y, colors.skin);
      }
    }
  }

  function drawLegs(d, colors) {
    // 左腿
    for (var y = LEG_Y1; y <= LEG_Y2; y++) {
      for (var x = LEG_LEFT_X1; x <= LEG_LEFT_X2; x++) {
        // 裤子和鞋的颜色
        var color = y < LEG_Y2 - 2 ? colors.cloth : colors.outline;
        if (y >= LEG_Y2 - 2) {
          // 鞋：暗色
          color = { r: 40, g: 40, b: 40 };
        }
        setPixel(d, x, y, color);
      }
    }

    // 右腿
    for (var y = LEG_Y1; y <= LEG_Y2; y++) {
      for (var x = LEG_RIGHT_X1; x <= LEG_RIGHT_X2; x++) {
        var color = y < LEG_Y2 - 2 ? colors.cloth : colors.outline;
        if (y >= LEG_Y2 - 2) {
          color = { r: 40, g: 40, b: 40 };
        }
        setPixel(d, x, y, color);
      }
    }
  }

  // ==================== 通用模式渲染 ====================

  function renderGeneric(imageData, outputSize) {
    var targetSize = outputSize || 48;
    var srcSize = imageData.width;

    // 在源尺寸上量化：颜色数 ≤ 12
    var colorCount = srcSize <= 32 ? 8 : 12;
    var quantized = window.App.pixelUtils.quantizeColors(imageData, colorCount);

    // 在源尺寸上处理
    var canvas = document.createElement('canvas');
    canvas.width = srcSize;
    canvas.height = srcSize;
    var ctx = canvas.getContext('2d');
    ctx.putImageData(quantized.imageData, 0, 0);

    // 轮廓 + 阴影 + 清理
    var resultData = ctx.getImageData(0, 0, srcSize, srcSize);
    var outlined = window.App.pixelUtils.applyOutline(resultData);
    var shadowed = window.App.pixelUtils.applyDirectionalShadow(outlined);
    var cleaned = window.App.pixelUtils.removeIsolatedPixels(shadowed, 2);

    // 缩放到目标尺寸
    if (targetSize !== srcSize) {
      var scaledCanvas = window.App.pixelUtils.nearestNeighborScaleToCanvas(cleaned, targetSize, targetSize);
      return scaledCanvas.toDataURL('image/png');
    }

    ctx.putImageData(cleaned, 0, 0);
    return canvas.toDataURL('image/png');
  }

  // ==================== 暴露API ====================

  window.App = window.App || {};
  window.App.templates = {
    isTemplateSuitable: isTemplateSuitable,
    renderTemplate: renderTemplate,
    renderGeneric: renderGeneric,
    SIZE: SIZE
  };

})();
