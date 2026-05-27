// pixel-utils.js — 像素画底层工具函数
// Median Cut 颜色量化 + 硬边轮廓 + 离散阴影 + 杂色清理 + 最近邻缩放

(function () {
  'use strict';

  var ALPHA_THRESHOLD = 10;
  var OUTLINE_COLOR_R = 0;
  var OUTLINE_COLOR_G = 0;
  var OUTLINE_COLOR_B = 0;

  // ==================== Median Cut 颜色量化 ====================

  function quantizeColors(imageData, colorCount) {
    var data = imageData.data;
    var w = imageData.width;
    var h = imageData.height;

    // 收集可见像素
    var pixels = [];
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] > ALPHA_THRESHOLD) {
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], idx: i });
      }
    }

    if (pixels.length === 0) {
      return { imageData: imageData, palette: [] };
    }

    var palette = medianCut(pixels, colorCount);

    // 兜底：如果量化返回空，返回原图
    if (palette.length === 0) {
      return { imageData: imageData, palette: [] };
    }

    // 像素映射到最近调色板颜色
    var output = new ImageData(w, h);
    var outData = output.data;
    for (var i = 0; i < data.length; i++) {
      outData[i] = data[i];
    }

    for (var p = 0; p < pixels.length; p++) {
      var px = pixels[p];
      var best = palette[0];
      var bestDist = Infinity;
      for (var c = 0; c < palette.length; c++) {
        var dr = px.r - palette[c].r;
        var dg = px.g - palette[c].g;
        var db = px.b - palette[c].b;
        var dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          best = palette[c];
        }
      }
      outData[px.idx] = best.r;
      outData[px.idx + 1] = best.g;
      outData[px.idx + 2] = best.b;
    }

    return { imageData: output, palette: palette };
  }

  function medianCut(pixels, maxColors) {
    if (pixels.length === 0) return [];

    var buckets = [{ pixels: pixels.slice(), rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 }];
    computeBucketRange(buckets[0]);

    while (buckets.length < maxColors) {
      // 找范围最大的桶
      var bestIdx = 0;
      var bestRange = 0;
      for (var i = 0; i < buckets.length; i++) {
        var b = buckets[i];
        var rRange = b.rMax - b.rMin;
        var gRange = b.gMax - b.gMin;
        var bRange = b.bMax - b.bMin;
        var maxRange = Math.max(rRange, gRange, bRange);
        if (maxRange > bestRange && b.pixels.length > 1) {
          bestRange = maxRange;
          bestIdx = i;
        }
      }

      if (bestRange === 0) break;

      var bucket = buckets[bestIdx];
      var channel;
      if (bestRange === bucket.rMax - bucket.rMin) {
        channel = 'r';
      } else if (bestRange === bucket.gMax - bucket.gMin) {
        channel = 'g';
      } else {
        channel = 'b';
      }

      // 按通道排序
      bucket.pixels.sort(function (a, b) {
        return a[channel] - b[channel];
      });

      // 加权中位数处二分
      var totalWeight = 0;
      var weights = bucket.pixels.map(function (p, idx) {
        // 像素的视觉权重（亮度加权避免暗色过度集中）
        var w = 1 + 0.5 * (p.r + p.g + p.b) / (3 * 255);
        totalWeight += w;
        return w;
      });

      var halfWeight = totalWeight / 2;
      var running = 0;
      var splitIdx = Math.floor(bucket.pixels.length / 2);
      for (var j = 0; j < weights.length; j++) {
        running += weights[j];
        if (running >= halfWeight) {
          splitIdx = Math.max(1, Math.min(bucket.pixels.length - 1, j + 1));
          break;
        }
      }

      var left = bucket.pixels.slice(0, splitIdx);
      var right = bucket.pixels.slice(splitIdx);

      var leftBucket = { pixels: left, rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 };
      var rightBucket = { pixels: right, rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 };
      computeBucketRange(leftBucket);
      computeBucketRange(rightBucket);

      buckets.splice(bestIdx, 1, leftBucket, rightBucket);
    }

    // 每桶取均值
    var palette = [];
    for (var i = 0; i < buckets.length; i++) {
      var bk = buckets[i];
      var sumR = 0, sumG = 0, sumB = 0;
      for (var j = 0; j < bk.pixels.length; j++) {
        sumR += bk.pixels[j].r;
        sumG += bk.pixels[j].g;
        sumB += bk.pixels[j].b;
      }
      palette.push({
        r: Math.round(sumR / bk.pixels.length),
        g: Math.round(sumG / bk.pixels.length),
        b: Math.round(sumB / bk.pixels.length)
      });
    }

    return palette;
  }

  function computeBucketRange(bucket) {
    for (var i = 0; i < bucket.pixels.length; i++) {
      var p = bucket.pixels[i];
      if (p.r < bucket.rMin) bucket.rMin = p.r;
      if (p.r > bucket.rMax) bucket.rMax = p.r;
      if (p.g < bucket.gMin) bucket.gMin = p.g;
      if (p.g > bucket.gMax) bucket.gMax = p.g;
      if (p.b < bucket.bMin) bucket.bMin = p.b;
      if (p.b > bucket.bMax) bucket.bMax = p.b;
    }
  }

  // ==================== 硬边轮廓（Alpha 边界） ====================

  function applyOutline(imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var output = new ImageData(w, h);
    var outData = output.data;

    for (var i = 0; i < data.length; i++) {
      outData[i] = data[i];
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] <= ALPHA_THRESHOLD) continue;

        // 检查4邻域：有透明邻居 → 边缘像素
        var neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (var n = 0; n < 4; n++) {
          var nx = x + neighbors[n][0];
          var ny = y + neighbors[n][1];
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          var nidx = (ny * w + nx) * 4;
          if (data[nidx + 3] <= ALPHA_THRESHOLD) {
            outData[idx] = OUTLINE_COLOR_R;
            outData[idx + 1] = OUTLINE_COLOR_G;
            outData[idx + 2] = OUTLINE_COLOR_B;
            outData[idx + 3] = 255;
            break;
          }
        }
      }
    }

    return output;
  }

  // ==================== 离散方向阴影 ====================

  function applyDirectionalShadow(imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var output = new ImageData(w, h);
    var outData = output.data;

    for (var i = 0; i < data.length; i++) {
      outData[i] = data[i];
    }

    var SHADOW_DARKEN = 0.65;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] <= ALPHA_THRESHOLD) continue;

        // 检查左下/下/右下方向是否超出主体边界（阴影边）
        var isShadowEdge = false;
        if (y < h - 1 && data[((y + 1) * w + x) * 4 + 3] <= ALPHA_THRESHOLD) isShadowEdge = true;
        if (x < w - 1 && data[(y * w + (x + 1)) * 4 + 3] <= ALPHA_THRESHOLD) isShadowEdge = true;

        // 确保上方/左侧有内容（光照方向为左上）
        var hasTopLeft = false;
        if (y > 0 && x > 0 && data[((y - 1) * w + (x - 1)) * 4 + 3] > ALPHA_THRESHOLD) hasTopLeft = true;
        if (y > 0 && data[((y - 1) * w + x) * 4 + 3] > ALPHA_THRESHOLD) hasTopLeft = true;
        if (x > 0 && data[(y * w + (x - 1)) * 4 + 3] > ALPHA_THRESHOLD) hasTopLeft = true;

        if (isShadowEdge && hasTopLeft) {
          outData[idx] = Math.round(data[idx] * SHADOW_DARKEN);
          outData[idx + 1] = Math.round(data[idx + 1] * SHADOW_DARKEN);
          outData[idx + 2] = Math.round(data[idx + 2] * SHADOW_DARKEN);
        }
      }
    }

    return output;
  }

  // ==================== 孤立像素清理 ====================

  function removeIsolatedPixels(imageData, iterations) {
    var iters = iterations || 2;
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var result = new ImageData(w, h);
    var outData = result.data;

    for (var iter = 0; iter < iters; iter++) {
      var src = iter === 0 ? data : outData;
      for (var i = 0; i < src.length; i++) {
        outData[i] = src[i];
      }

      for (var y = 1; y < h - 1; y++) {
        for (var x = 1; x < w - 1; x++) {
          var idx = (y * w + x) * 4;
          if (src[idx + 3] <= ALPHA_THRESHOLD) continue;

          var selfKey = src[idx] + ',' + src[idx + 1] + ',' + src[idx + 2];
          var sameCount = 0;
          var neighbors = {};

          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              var nidx = ((y + dy) * w + (x + dx)) * 4;
              if (src[nidx + 3] <= ALPHA_THRESHOLD) continue;
              var nkey = src[nidx] + ',' + src[nidx + 1] + ',' + src[nidx + 2];
              neighbors[nkey] = (neighbors[nkey] || 0) + 1;
              if (nkey === selfKey) sameCount++;
            }
          }

          if (sameCount < 2) {
            var bestKey = null;
            var bestCount = 0;
            var keys = Object.keys(neighbors);
            for (var k = 0; k < keys.length; k++) {
              if (neighbors[keys[k]] > bestCount) {
                bestCount = neighbors[keys[k]];
                bestKey = keys[k];
              }
            }
            if (bestKey) {
              var parts = bestKey.split(',');
              outData[idx] = parseInt(parts[0], 10);
              outData[idx + 1] = parseInt(parts[1], 10);
              outData[idx + 2] = parseInt(parts[2], 10);
            }
          }
        }
      }
    }

    return result;
  }

  // ==================== 最近邻缩放 ====================

  function nearestNeighborScale(imageData, scale) {
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var newW = w * scale;
    var newH = h * scale;
    var output = new ImageData(newW, newH);
    var outData = output.data;

    for (var y = 0; y < newH; y++) {
      for (var x = 0; x < newW; x++) {
        var srcX = Math.floor(x / scale);
        var srcY = Math.floor(y / scale);
        var srcIdx = (srcY * w + srcX) * 4;
        var dstIdx = (y * newW + x) * 4;
        outData[dstIdx] = data[srcIdx];
        outData[dstIdx + 1] = data[srcIdx + 1];
        outData[dstIdx + 2] = data[srcIdx + 2];
        outData[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    return output;
  }

  function nearestNeighborScaleToCanvas(imageData, targetW, targetH) {
    var w = imageData.width;
    var h = imageData.height;
    var outCanvas = document.createElement('canvas');
    outCanvas.width = targetW;
    outCanvas.height = targetH;
    var ctx = outCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    var tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, targetW, targetH);

    return outCanvas;
  }

  // ==================== ImageData → DataURL ====================

  function imageDataToDataURL(imageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    var ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  // ==================== 综合清理 ====================

  function cleanPixelArt(imageData) {
    // 清理孤立像素 + 方向阴影
    var cleaned = removeIsolatedPixels(imageData, 2);
    return applyDirectionalShadow(cleaned);
  }

  // ==================== 暴露API ====================

  window.App = window.App || {};
  window.App.pixelUtils = {
    quantizeColors: quantizeColors,
    applyOutline: applyOutline,
    applyDirectionalShadow: applyDirectionalShadow,
    removeIsolatedPixels: removeIsolatedPixels,
    nearestNeighborScale: nearestNeighborScale,
    nearestNeighborScaleToCanvas: nearestNeighborScaleToCanvas,
    imageDataToDataURL: imageDataToDataURL,
    cleanPixelArt: cleanPixelArt,
    ALPHA_THRESHOLD: ALPHA_THRESHOLD
  };

})();
