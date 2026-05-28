// pixelate.js — 像素化算法（Phase 9 单一管线）
// 分块取色 → Median Cut 色板量化 → 轮廓增强

(function () {
  'use strict';

  var TARGET_SIZE = 128;
  var ALPHA_THRESHOLD = 10;

  // ==================== 主体外接框扫描 ====================

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

  // ==================== 宽高比自适应裁切 ====================

  function loadImageToFitCanvas(img, outputSize) {
    var size = outputSize || TARGET_SIZE;

    var nativeCanvas = document.createElement('canvas');
    nativeCanvas.width = img.width;
    nativeCanvas.height = img.height;
    var nativeCtx = nativeCanvas.getContext('2d');
    nativeCtx.drawImage(img, 0, 0);
    var nativeData = nativeCtx.getImageData(0, 0, img.width, img.height);

    var bounds = getSubjectBounds(nativeData);

    if (!bounds.hasVisible) {
      return null;
    }

    var bbW = bounds.maxX - bounds.minX + 1;
    var bbH = bounds.maxY - bounds.minY + 1;
    var maxDim = Math.max(bbW, bbH);
    var pad = Math.max(Math.round(maxDim * 0.1), 5);

    var cropX = Math.max(0, bounds.minX - pad);
    var cropY = Math.max(0, bounds.minY - pad);
    var cropW = Math.min(img.width - cropX, bbW + 2 * pad);
    var cropH = Math.min(img.height - cropY, bbH + 2 * pad);

    var cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    var cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    var outCanvas = document.createElement('canvas');
    outCanvas.width = size;
    outCanvas.height = size;
    var outCtx = outCanvas.getContext('2d');

    var scale = size / Math.max(cropW, cropH);
    var scaledW = Math.round(cropW * scale);
    var scaledH = Math.round(cropH * scale);
    var offsetX = Math.round((size - scaledW) / 2);
    var offsetY = Math.round((size - scaledH) / 2);

    outCtx.drawImage(cropCanvas, 0, 0, cropW, cropH, offsetX, offsetY, scaledW, scaledH);

    return { canvas: outCanvas, ctx: outCtx, bounds: bounds };
  }

  // ==================== 图片加载 ====================

  function loadImageToDataURL(imageSource) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var result = loadImageToFitCanvas(img, TARGET_SIZE);
        if (!result) {
          reject(new Error(window.App.t('error.noSubject')));
          return;
        }
        resolve(result.canvas.toDataURL('image/png'));
      };
      img.onerror = function () {
        reject(new Error(window.App.t('error.imgLoadFailed')));
      };
      img.src = imageSource;
    });
  }

  function getImageDataFromSource(imageSource) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var result = loadImageToFitCanvas(img, TARGET_SIZE);
        if (!result) {
          reject(new Error(window.App.t('error.noSubject')));
          return;
        }
        resolve(result.ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE));
      };
      img.onerror = function () {
        reject(new Error(window.App.t('error.imgLoadFailed')));
      };
      img.src = imageSource;
    });
  }

  // ==================== 对称增强 ====================

  var SYMMETRY_MIN_ASYMMETRIC_AREA = 16; // 不对称特征的最小保护面积

  function enhanceSymmetry(imageData, w, h) {
    var data = imageData.data;
    var mid = Math.floor(w / 2);

    // 遍历左半部分，对比右半镜像
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < mid; x++) {
        var mx = w - 1 - x;
        var idxL = (y * w + x) * 4;
        var idxR = (y * w + mx) * 4;
        var aL = data[idxL + 3];
        var aR = data[idxR + 3];
        var lVisible = aL > ALPHA_THRESHOLD;
        var rVisible = aR > ALPHA_THRESHOLD;

        if (lVisible && rVisible) {
          // 两侧都可见：70%左 + 30%右混合
          data[idxL]     = Math.round(data[idxL] * 0.7 + data[idxR] * 0.3);
          data[idxL + 1] = Math.round(data[idxL + 1] * 0.7 + data[idxR + 1] * 0.3);
          data[idxL + 2] = Math.round(data[idxL + 2] * 0.7 + data[idxR + 2] * 0.3);
          data[idxR]     = data[idxL];
          data[idxR + 1] = data[idxL + 1];
          data[idxR + 2] = data[idxL + 2];
          data[idxR + 3] = Math.max(data[idxL + 3], data[idxR + 3]);
          data[idxL + 3] = data[idxR + 3];
        } else if (lVisible && !rVisible) {
          // 仅左侧可见：复制到右侧
          data[idxR]     = data[idxL];
          data[idxR + 1] = data[idxL + 1];
          data[idxR + 2] = data[idxL + 2];
          data[idxR + 3] = data[idxL + 3];
        } else if (!lVisible && rVisible) {
          // 仅右侧可见：检测是否为不对称特征
          var area = measureConnectedArea(imageData, w, h, mx, y);
          if (area >= SYMMETRY_MIN_ASYMMETRIC_AREA) {
            // 保留不对称特征，复制到左侧
            data[idxL]     = data[idxR];
            data[idxL + 1] = data[idxR + 1];
            data[idxL + 2] = data[idxR + 2];
            data[idxL + 3] = data[idxR + 3];
          }
          // 面积小则保持透明（已被对称处理忽略）
        }
      }
    }
    return imageData;
  }

  // BFS 测量连通区域面积（用于判断不对称特征大小）
  function measureConnectedArea(imageData, w, h, startX, startY) {
    var data = imageData.data;
    var visited = new Uint8Array(w * h);
    var queue = [[startX, startY]];
    visited[startY * w + startX] = 1;
    var area = 0;

    while (queue.length > 0) {
      var q = queue.shift();
      area++;
      if (area > SYMMETRY_MIN_ASYMMETRIC_AREA) return area; // 早停

      var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (var d = 0; d < 4; d++) {
        var nx = q[0] + dirs[d][0], ny = q[1] + dirs[d][1];
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        if (visited[ny * w + nx]) continue;
        var nidx = (ny * w + nx) * 4;
        if (data[nidx + 3] > ALPHA_THRESHOLD) {
          visited[ny * w + nx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
    return area;
  }

  // ==================== 分块取色平均 ====================

  function pixelate(imageData, pixelSize) {
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var output = new ImageData(w, h);
    var outData = output.data;

    for (var blockY = 0; blockY < h; blockY += pixelSize) {
      for (var blockX = 0; blockX < w; blockX += pixelSize) {
        var r = 0, g = 0, b = 0, a = 0, count = 0;

        for (var dy = 0; dy < pixelSize; dy++) {
          for (var dx = 0; dx < pixelSize; dx++) {
            var px = blockX + dx;
            var py = blockY + dy;
            if (px >= w || py >= h) continue;
            var idx = (py * w + px) * 4;
            if (data[idx + 3] > ALPHA_THRESHOLD) {
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
            a += data[idx + 3];
          }
        }

        var avgR = count > 0 ? Math.round(r / count) : 0;
        var avgG = count > 0 ? Math.round(g / count) : 0;
        var avgB = count > 0 ? Math.round(b / count) : 0;
        var blockPixelCount = Math.min(pixelSize, w - blockX) * Math.min(pixelSize, h - blockY);
        var avgA = Math.round(a / blockPixelCount);

        for (var dy = 0; dy < pixelSize; dy++) {
          for (var dx = 0; dx < pixelSize; dx++) {
            var px = blockX + dx;
            var py = blockY + dy;
            if (px >= w || py >= h) continue;
            var idx = (py * w + px) * 4;
            outData[idx] = avgR;
            outData[idx + 1] = avgG;
            outData[idx + 2] = avgB;
            outData[idx + 3] = avgA;
          }
        }
      }
    }

    return output;
  }

  // ==================== 颜色量化（含后处理） ====================

  // 受保护的核心基础色
  var PROTECTED_COLORS = [
    { r: 0,   g: 0,   b: 0   },  // #000000 纯黑
    { r: 255, g: 255, b: 255 },  // #FFFFFF 纯白
    { r: 255, g: 0,   b: 0   },  // #FF0000 纯红
    { r: 255, g: 255, b: 0   },  // #FFFF00 纯黄
    { r: 255, g: 204, b: 153 }   // #FFCC99 标准浅肤色
  ];

  var COLOR_MERGE_THRESHOLD = 35;    // 相似色合并的 RGB 距离阈值
  var PROTECTED_COLOR_DIST = 30;     // 保护色匹配距离阈值
  var NOISE_NEIGHBOR_THRESHOLD = 2;  // 杂色清理的同类邻居数阈值
  var BLOCK_AREA_THRESHOLD = 40;     // 大面积色块简化面积阈值
  var KEY_FEATURE_BRIGHTNESS_DIFF = 50;  // 关键特征亮度差阈值
  var KEY_FEATURE_MAX_AREA = 16;         // 关键特征最大面积

  // 检测高对比度小面积关键特征
  function detectKeyFeatures(imageData, w, h) {
    var data = imageData.data;
    var keyMap = new Uint8Array(w * h);

    // 计算每个可见像素的亮度
    var luminance = new Float32Array(w * h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] > ALPHA_THRESHOLD) {
          luminance[y * w + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        } else {
          luminance[y * w + x] = -1;
        }
      }
    }

    // 检测与周围亮度差大的像素
    var candidates = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (luminance[y * w + x] < 0) continue;
        var lum = luminance[y * w + x];
        var maxDiff = 0;

        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (luminance[ny * w + nx] < 0) continue;
            var diff = Math.abs(lum - luminance[ny * w + nx]);
            if (diff > maxDiff) maxDiff = diff;
          }
        }

        if (maxDiff > KEY_FEATURE_BRIGHTNESS_DIFF) {
          candidates.push({ x: x, y: y, lum: lum });
        }
      }
    }

    // BFS 检测每个候选区域面积，小面积标记为关键特征
    var visited = new Uint8Array(w * h);
    for (var c = 0; c < candidates.length; c++) {
      var cx = candidates[c].x, cy = candidates[c].y;
      if (visited[cy * w + cx]) continue;

      var region = [];
      var queue = [[cx, cy]];
      visited[cy * w + cx] = 1;

      while (queue.length > 0 && region.length < KEY_FEATURE_MAX_AREA) {
        var q = queue.shift();
        region.push(q);
        var idx = (q[1] * w + q[0]) * 4;
        var isBlackWhite = (data[idx] === 0 && data[idx + 1] === 0 && data[idx + 2] === 0) ||
                           (data[idx] === 255 && data[idx + 1] === 255 && data[idx + 2] === 255);

        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nx = q[0] + dx, ny = q[1] + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (visited[ny * w + nx]) continue;
            var nidx = (ny * w + nx) * 4;
            if (data[nidx + 3] <= ALPHA_THRESHOLD) continue;
            visited[ny * w + nx] = 1;
            queue.push([nx, ny]);
          }
        }
      }

      if (region.length > 0 && region.length < KEY_FEATURE_MAX_AREA) {
        for (var r = 0; r < region.length; r++) {
          keyMap[region[r][1] * w + region[r][0]] = 1;
        }
      }
    }

    return keyMap;
  }

  function applyPalette(imageData, colorCount, keyFeatureMap) {
    var data = imageData.data;
    var w = imageData.width;
    var h = imageData.height;

    // 收集所有可见像素
    var pixels = [];
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] > ALPHA_THRESHOLD) {
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], idx: i });
      }
    }

    if (pixels.length === 0) return imageData;

    // Step 1: Median Cut 生成初始色板
    var palette = medianCut(pixels, colorCount);
    if (palette.length === 0) return imageData;

    // Step 2: 对比度增强
    palette = boostPaletteContrast(palette);

    // Step 3: 注入受保护核心色（若原图中存在相近色）
    palette = injectProtectedColors(palette, pixels);

    // Step 4: 合并相似色
    palette = mergeSimilarColors(palette);

    // Step 5: 将像素映射到最近色板颜色（关键特征加权保护）
    var output = new ImageData(w, h);
    var outData = output.data;
    for (var i = 0; i < data.length; i++) {
      outData[i] = data[i];
    }
    for (var p = 0; p < pixels.length; p++) {
      var px = pixels[p];
      var x = (px.idx / 4) % w;
      var y = Math.floor((px.idx / 4) / w);
      var isKey = keyFeatureMap && keyFeatureMap[y * w + x] === 1;

      // 关键特征像素：优先匹配保护色
      if (isKey) {
        // 检查是否为纯黑或纯白
        if (px.r === 0 && px.g === 0 && px.b === 0) {
          outData[px.idx] = 0; outData[px.idx + 1] = 0; outData[px.idx + 2] = 0;
          outData[px.idx + 3] = 255;
          continue;
        }
        if (px.r === 255 && px.g === 255 && px.b === 255) {
          outData[px.idx] = 255; outData[px.idx + 1] = 255; outData[px.idx + 2] = 255;
          outData[px.idx + 3] = 255;
          continue;
        }
        // 检查是否接近某个保护色
        var matchedProtected = false;
        for (var pc = 0; pc < PROTECTED_COLORS.length; pc++) {
          var pr = PROTECTED_COLORS[pc];
          var dr2 = px.r - pr.r, dg2 = px.g - pr.g, db2 = px.b - pr.b;
          if (dr2 * dr2 + dg2 * dg2 + db2 * db2 < 15 * 15) {
            outData[px.idx] = pr.r; outData[px.idx + 1] = pr.g; outData[px.idx + 2] = pr.b;
            outData[px.idx + 3] = 255;
            matchedProtected = true;
            break;
          }
        }
        if (matchedProtected) continue;
      }

      var best = palette[0];
      var bestDist = Infinity;
      for (var c = 0; c < palette.length; c++) {
        var dr = px.r - palette[c].r;
        var dg = px.g - palette[c].g;
        var db = px.b - palette[c].b;
        var dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) { bestDist = dist; best = palette[c]; }
      }
      outData[px.idx] = best.r;
      outData[px.idx + 1] = best.g;
      outData[px.idx + 2] = best.b;
      outData[px.idx + 3] = 255;
    }

    // Step 6: 色块最终优化（替换旧的 simplifyLargeBlocks + cleanIsolatedColorPixels）
    output = finalizeColorBlocks(output, w, h);

    // Step 7: 强制所有可见像素 alpha = 255
    var finalData = output.data;
    for (var i = 0; i < finalData.length; i += 4) {
      if (finalData[i + 3] > ALPHA_THRESHOLD) {
        finalData[i + 3] = 255;
      }
    }

    return output;
  }

  // 对比度增强：将颜色从中间灰(128)向外拉伸，让亮色更亮、暗色更暗
  function boostPaletteContrast(palette) {
    var factor = 1.15;
    var result = [];
    for (var i = 0; i < palette.length; i++) {
      var c = palette[i];
      result.push({
        r: Math.max(0, Math.min(255, Math.round(128 + (c.r - 128) * factor))),
        g: Math.max(0, Math.min(255, Math.round(128 + (c.g - 128) * factor))),
        b: Math.max(0, Math.min(255, Math.round(128 + (c.b - 128) * factor)))
      });
    }
    return result;
  }

  // 注入受保护核心色：若原图中存在与保护色相近的像素，强制加入色板
  function injectProtectedColors(palette, pixels) {
    for (var i = 0; i < PROTECTED_COLORS.length; i++) {
      var pc = PROTECTED_COLORS[i];
      // 检查原图是否有相近像素
      var hasMatch = false;
      for (var j = 0; j < pixels.length && !hasMatch; j++) {
        var dr = pixels[j].r - pc.r;
        var dg = pixels[j].g - pc.g;
        var db = pixels[j].b - pc.b;
        if (dr * dr + dg * dg + db * db < PROTECTED_COLOR_DIST * PROTECTED_COLOR_DIST) {
          hasMatch = true;
        }
      }
      if (!hasMatch) continue;

      // 检查色板中是否已存在该保护色
      var alreadyExists = false;
      for (var k = 0; k < palette.length; k++) {
        if (palette[k].r === pc.r && palette[k].g === pc.g && palette[k].b === pc.b) {
          alreadyExists = true;
          break;
        }
      }
      if (!alreadyExists) {
        palette.push({ r: pc.r, g: pc.g, b: pc.b });
      }
    }
    return palette;
  }

  // 合并 RGB 距离过近的相似色，保留更接近保护色的那个
  function mergeSimilarColors(palette) {
    var merged = palette.slice();
    var changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i < merged.length; i++) {
        for (var j = i + 1; j < merged.length; j++) {
          var dr = merged[i].r - merged[j].r;
          var dg = merged[i].g - merged[j].g;
          var db = merged[i].b - merged[j].b;
          var dist = Math.sqrt(dr * dr + dg * dg + db * db);
          if (dist < COLOR_MERGE_THRESHOLD) {
            // 保留更接近保护色的，另一个用加权平均替代
            var iProtected = isProtectedColor(merged[i]);
            var jProtected = isProtectedColor(merged[j]);
            if (iProtected && !jProtected) {
              merged.splice(j, 1);
            } else if (jProtected && !iProtected) {
              merged.splice(i, 1);
            } else {
              // 都不受保护或都受保护：合并为加权平均
              merged[i] = {
                r: Math.round((merged[i].r + merged[j].r) / 2),
                g: Math.round((merged[i].g + merged[j].g) / 2),
                b: Math.round((merged[i].b + merged[j].b) / 2)
              };
              merged.splice(j, 1);
            }
            changed = true;
            if (i >= merged.length) break;
            j = i + 1;
            if (j >= merged.length) break;
          }
        }
      }
    }
    return merged;
  }

  function isProtectedColor(c) {
    for (var i = 0; i < PROTECTED_COLORS.length; i++) {
      var pc = PROTECTED_COLORS[i];
      if (c.r === pc.r && c.g === pc.g && c.b === pc.b) return true;
    }
    return false;
  }

  // ==================== 色块最终优化 ====================

  var SMALL_BLOCK_MAX = 4;        // 小色块面积阈值
  var LARGE_BLOCK_MIN = 16;       // 大色块面积阈值

  function finalizeColorBlocks(imageData, w, h) {
    var data = imageData.data;
    var output = new ImageData(w, h);
    var outData = output.data;
    for (var i = 0; i < data.length; i++) outData[i] = data[i];

    // Step a: 删除孤立单像素（4-neighbor 全部不同色）
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] <= ALPHA_THRESHOLD) continue;
        var r = data[idx], g = data[idx + 1], b = data[idx + 2];

        var sameCount = 0;
        var neighborColors = {};
        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (var d = 0; d < 4; d++) {
          var nx = x + dirs[d][0], ny = y + dirs[d][1];
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          var nidx = (ny * w + nx) * 4;
          if (data[nidx + 3] <= ALPHA_THRESHOLD) continue;
          var nr = data[nidx], ng = data[nidx + 1], nb = data[nidx + 2];
          if (nr === r && ng === g && nb === b) sameCount++;
          var key2 = nr + ',' + ng + ',' + nb;
          neighborColors[key2] = (neighborColors[key2] || 0) + 1;
        }

        if (sameCount === 0 && dirs.length > 0) {
          var bestKey = null, bestCnt = 0;
          var keys = Object.keys(neighborColors);
          for (var k = 0; k < keys.length; k++) {
            if (neighborColors[keys[k]] > bestCnt) {
              bestCnt = neighborColors[keys[k]];
              bestKey = keys[k];
            }
          }
          if (bestKey) {
            var parts = bestKey.split(',');
            outData[idx] = parseInt(parts[0]);
            outData[idx + 1] = parseInt(parts[1]);
            outData[idx + 2] = parseInt(parts[2]);
            outData[idx + 3] = 255;
          }
        }
      }
    }

    // Step b: BFS 连通域分析 — 合并小色块，简化大色块
    var visited = new Uint8Array(w * h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (outData[idx + 3] <= ALPHA_THRESHOLD) continue;
        if (visited[y * w + x]) continue;

        var targetR = outData[idx], targetG = outData[idx + 1], targetB = outData[idx + 2];
        var region = [];
        var queue = [[x, y]];
        var colorSet = {}; // { 'r,g,b': count }
        visited[y * w + x] = 1;

        while (queue.length > 0) {
          var q = queue.shift();
          region.push(q);
          var rix = (q[1] * w + q[0]) * 4;
          var key3 = outData[rix] + ',' + outData[rix + 1] + ',' + outData[rix + 2];
          colorSet[key3] = (colorSet[key3] || 0) + 1;

          var dirs2 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (var d = 0; d < 4; d++) {
            var nx = q[0] + dirs2[d][0], ny = q[1] + dirs2[d][1];
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            if (visited[ny * w + nx]) continue;
            var nidx = (ny * w + nx) * 4;
            if (outData[nidx + 3] <= ALPHA_THRESHOLD) continue;
            var dr3 = Math.abs(outData[nidx] - targetR);
            var dg3 = Math.abs(outData[nidx + 1] - targetG);
            var db3 = Math.abs(outData[nidx + 2] - targetB);
            if (dr3 < 5 && dg3 < 5 && db3 < 5) {
              visited[ny * w + nx] = 1;
              queue.push([nx, ny]);
            }
          }
        }

        if (region.length <= SMALL_BLOCK_MAX) {
          // 小色块：合并到周边最大同色系块
          var borderColors = {};
          for (var r = 0; r < region.length; r++) {
            var rx = region[r][0], ry = region[r][1];
            for (var d = 0; d < 4; d++) {
              var nx = rx + [[0, -1], [0, 1], [-1, 0], [1, 0]][d][0];
              var ny = ry + [[0, -1], [0, 1], [-1, 0], [1, 0]][d][1];
              if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
              if (visited[ny * w + nx]) continue;
              var nidx = (ny * w + nx) * 4;
              if (outData[nidx + 3] <= ALPHA_THRESHOLD) continue;
              var key4 = outData[nidx] + ',' + outData[nidx + 1] + ',' + outData[nidx + 2];
              borderColors[key4] = (borderColors[key4] || 0) + 1;
            }
          }
          var replacementColor = null, replacementCount = 0;
          var borderKeys = Object.keys(borderColors);
          for (var bk = 0; bk < borderKeys.length; bk++) {
            if (borderColors[borderKeys[bk]] > replacementCount) {
              replacementCount = borderColors[borderKeys[bk]];
              replacementColor = borderKeys[bk];
            }
          }
          if (replacementColor) {
            var rparts = replacementColor.split(',');
            for (var r2 = 0; r2 < region.length; r2++) {
              var rix2 = (region[r2][1] * w + region[r2][0]) * 4;
              outData[rix2] = parseInt(rparts[0]);
              outData[rix2 + 1] = parseInt(rparts[1]);
              outData[rix2 + 2] = parseInt(rparts[2]);
              outData[rix2 + 3] = 255;
            }
          }
        } else if (region.length > LARGE_BLOCK_MIN) {
          // 大色块：只保留主色和阴影色（最亮/最暗）
          var colorKeys = Object.keys(colorSet);
          if (colorKeys.length > 2) {
            // 按亮度排序
            var colorsWithLum = [];
            for (var ck = 0; ck < colorKeys.length; ck++) {
              var cparts = colorKeys[ck].split(',');
              var cr = parseInt(cparts[0]), cg = parseInt(cparts[1]), cb = parseInt(cparts[2]);
              var lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;
              colorsWithLum.push({ key: colorKeys[ck], r: cr, g: cg, b: cb, lum: lum, count: colorSet[colorKeys[ck]] });
            }
            colorsWithLum.sort(function (a, b) { return b.count - a.count; });
            var mainColor = colorsWithLum[0];
            // 极端色：最暗或最亮
            colorsWithLum.sort(function (a, b) { return a.lum - b.lum; });
            var darkColor = colorsWithLum[0];
            var brightColor = colorsWithLum[colorsWithLum.length - 1];
            var shadowColor = darkColor.lum < mainColor.lum - 20 ? darkColor : brightColor;

            for (var r3 = 0; r3 < region.length; r3++) {
              var rix3 = (region[r3][1] * w + region[r3][0]) * 4;
              var pxR = outData[rix3], pxG = outData[rix3 + 1], pxB = outData[rix3 + 2];
              var pxLum = 0.299 * pxR + 0.587 * pxG + 0.114 * pxB;
              var toMain = Math.abs(pxLum - mainColor.lum);
              var toShadow = Math.abs(pxLum - shadowColor.lum);
              if (toMain <= toShadow) {
                outData[rix3] = mainColor.r; outData[rix3 + 1] = mainColor.g; outData[rix3 + 2] = mainColor.b;
              } else {
                outData[rix3] = shadowColor.r; outData[rix3 + 1] = shadowColor.g; outData[rix3 + 2] = shadowColor.b;
              }
              outData[rix3 + 3] = 255;
            }
          }
        }
      }
    }

    // Step c: 填充 1-pixel 断裂和空洞
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idxC = (y * w + x) * 4;
        if (outData[idxC + 3] > ALPHA_THRESHOLD) continue;

        // 水平桥接
        var idxL = (y * w + (x - 1)) * 4;
        var idxR2 = (y * w + (x + 1)) * 4;
        if (outData[idxL + 3] > ALPHA_THRESHOLD && outData[idxR2 + 3] > ALPHA_THRESHOLD &&
            outData[idxL] === outData[idxR2] && outData[idxL + 1] === outData[idxR2 + 1] && outData[idxL + 2] === outData[idxR2 + 2]) {
          outData[idxC] = outData[idxL]; outData[idxC + 1] = outData[idxL + 1];
          outData[idxC + 2] = outData[idxL + 2]; outData[idxC + 3] = 255;
        }
        // 垂直桥接
        var idxU = ((y - 1) * w + x) * 4;
        var idxD = ((y + 1) * w + x) * 4;
        if (outData[idxU + 3] > ALPHA_THRESHOLD && outData[idxD + 3] > ALPHA_THRESHOLD &&
            outData[idxU] === outData[idxD] && outData[idxU + 1] === outData[idxD + 1] && outData[idxU + 2] === outData[idxD + 2]) {
          outData[idxC] = outData[idxU]; outData[idxC + 1] = outData[idxU + 1];
          outData[idxC + 2] = outData[idxU + 2]; outData[idxC + 3] = 255;
        }
      }
    }

    return output;
  }

  function medianCut(pixels, maxColors) {
    if (pixels.length === 0) return [];

    var buckets = [{ pixels: pixels.slice(), rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 }];
    computeBucketRange(buckets[0]);

    while (buckets.length < maxColors) {
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

      bucket.pixels.sort(function (a, b) {
        return a[channel] - b[channel];
      });

      var totalWeight = 0;
      var weights = [];
      for (var j = 0; j < bucket.pixels.length; j++) {
        var p = bucket.pixels[j];
        var w = 1 + 0.5 * (p.r + p.g + p.b) / (3 * 255);
        totalWeight += w;
        weights.push(w);
      }

      var halfWeight = totalWeight / 2;
      var running = 0;
      var splitIdx = Math.floor(bucket.pixels.length / 2);
      for (var j2 = 0; j2 < weights.length; j2++) {
        running += weights[j2];
        if (running >= halfWeight) {
          splitIdx = Math.max(1, Math.min(bucket.pixels.length - 1, j2 + 1));
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

    var palette = [];
    for (var k = 0; k < buckets.length; k++) {
      var bk = buckets[k];
      var sumR = 0, sumG = 0, sumB = 0;
      for (var m = 0; m < bk.pixels.length; m++) {
        sumR += bk.pixels[m].r;
        sumG += bk.pixels[m].g;
        sumB += bk.pixels[m].b;
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

  // ==================== 智能外轮廓（绘制在透明侧 + 轮廓打磨） ====================

  function applyOutline(imageData, pixelSize) {
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var OUTLINE_R = 0, OUTLINE_G = 0, OUTLINE_B = 0;

    // Step 1: 检测外轮廓像素 — 绘制在透明像素上（邻接非透明像素）
    var outlineMap = new Uint8Array(w * h);
    var neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] > ALPHA_THRESHOLD) continue;
        for (var n = 0; n < 4; n++) {
          var nx = x + neighbors[n][0];
          var ny = y + neighbors[n][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            var nidx = (ny * w + nx) * 4;
            if (data[nidx + 3] > ALPHA_THRESHOLD) {
              outlineMap[y * w + x] = 1;
              break;
            }
          }
        }
      }
    }

    // Step 2: 轮廓最终打磨（删除孤立、45°转角、连接断点）
    outlineMap = polishOutline(outlineMap, w, h);

    // Step 3: 应用轮廓到输出图像
    var output = new ImageData(w, h);
    var outData = output.data;
    for (var i = 0; i < data.length; i++) {
      outData[i] = data[i];
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (outlineMap[y * w + x] === 1) {
          var oidx = (y * w + x) * 4;
          outData[oidx] = OUTLINE_R;
          outData[oidx + 1] = OUTLINE_G;
          outData[oidx + 2] = OUTLINE_B;
          outData[oidx + 3] = 255;
        }
      }
    }

    return output;
  }

  // 轮廓最终打磨：去孤立、45°转角优先、连断点、保证 1px 宽度
  function polishOutline(outlineMap, w, h) {
    var result = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) result[i] = outlineMap[i];

    function isOutline(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      return outlineMap[y * w + x] === 1;
    }

    // Pass 1: 删除只有 1 个 4-neighbor 的孤立轮廓像素
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (!isOutline(x, y)) continue;
        var nCount = 0;
        if (isOutline(x - 1, y)) nCount++;
        if (isOutline(x + 1, y)) nCount++;
        if (isOutline(x, y - 1)) nCount++;
        if (isOutline(x, y + 1)) nCount++;
        if (nCount < 2) {
          result[y * w + x] = 0;
        }
      }
    }

    // Pass 2: 90° 转角 → 45° 斜线（若对角无轮廓则删除转角）
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (!isOutline(x, y)) continue;
        var n  = isOutline(x, y - 1), s = isOutline(x, y + 1);
        var e  = isOutline(x + 1, y), w = isOutline(x - 1, y);
        var nc4 = (n ? 1 : 0) + (s ? 1 : 0) + (e ? 1 : 0) + (w ? 1 : 0);
        if (nc4 !== 2) continue;

        if (n && e && !isOutline(x + 1, y - 1)) result[y * w + x] = 0;
        else if (n && w && !isOutline(x - 1, y - 1)) result[y * w + x] = 0;
        else if (s && e && !isOutline(x + 1, y + 1)) result[y * w + x] = 0;
        else if (s && w && !isOutline(x - 1, y + 1)) result[y * w + x] = 0;
      }
    }

    // Pass 3: 连接所有断点
    result = connectGaps(result, w, h);

    // Pass 4: 最后一次清理孤立像素
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (result[y * w + x] !== 1) continue;
        var nc = 0;
        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (var d = 0; d < 4; d++) {
          var nx = x + dirs[d][0], ny = y + dirs[d][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && result[ny * w + nx] === 1) nc++;
        }
        if (nc < 2) result[y * w + x] = 0;
      }
    }

    return result;
  }

  // 去除孤立轮廓像素：4-neighbor 中轮廓像素数 < 2 则删除
  function cleanIsolatedPixels(outlineMap, w, h) {
    var result = new Uint8Array(w * h);
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (outlineMap[y * w + x] !== 1) continue;

        var count = 0;
        for (var d = 0; d < 4; d++) {
          var nx = x + dirs[d][0];
          var ny = y + dirs[d][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && outlineMap[ny * w + nx] === 1) {
            count++;
          }
        }

        if (count >= 2) {
          result[y * w + x] = 1;
        }
      }
    }

    return result;
  }

  // 连接 1-pixel 断点：检测水平/垂直 1-0-1 模式并填充
  function connectGaps(outlineMap, w, h) {
    var result = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) {
      result[i] = outlineMap[i];
    }

    // 水平方向
    for (var y = 0; y < h; y++) {
      for (var x = 1; x < w - 1; x++) {
        if (outlineMap[y * w + (x - 1)] === 1 &&
            outlineMap[y * w + x] === 0 &&
            outlineMap[y * w + (x + 1)] === 1) {
          result[y * w + x] = 1;
        }
      }
    }

    // 垂直方向
    for (var y = 1; y < h - 1; y++) {
      for (var x = 0; x < w; x++) {
        if (outlineMap[(y - 1) * w + x] === 1 &&
            outlineMap[y * w + x] === 0 &&
            outlineMap[(y + 1) * w + x] === 1) {
          result[y * w + x] = 1;
        }
      }
    }

    return result;
  }

  // ==================== 复杂度检测 ====================

  var COMPLEXITY_MAX_COLORS = 500;
  var COMPLEXITY_MIN_RATIO = 0.03;
  var COMPLEXITY_WARN_RATIO = 0.08;
  var SIMPLE_SKIP_PALETTE_COLORS = 64;

  function analyzeImageComplexity(imageData) {
    var data = imageData.data;
    var totalPixels = imageData.width * imageData.height;
    var visibleCount = 0;
    var colorSet = {};

    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] > ALPHA_THRESHOLD) {
        visibleCount++;
        colorSet[Math.round(data[i] / 16) + ',' + Math.round(data[i + 1] / 16) + ',' + Math.round(data[i + 2] / 16)] = true;
      }
    }

    var uniqueColors = Object.keys(colorSet).length;
    var visibleRatio = totalPixels > 0 ? visibleCount / totalPixels : 0;

    var level;
    if (visibleRatio < COMPLEXITY_MIN_RATIO) {
      level = 'error';
    } else if (visibleRatio < COMPLEXITY_WARN_RATIO || uniqueColors > COMPLEXITY_MAX_COLORS) {
      level = 'complex';
    } else {
      level = 'simple';
    }

    return { uniqueColors: uniqueColors, visibleRatio: visibleRatio, level: level };
  }

  // ==================== 色彩增强 ====================

  function enhanceColors(imageData, w, h) {
    var data = imageData.data;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = (y * w + x) * 4;
        if (data[idx + 3] <= ALPHA_THRESHOLD) continue;

        var r = data[idx], g = data[idx + 1], b = data[idx + 2];

        // 保持纯黑纯白
        if (r === 0 && g === 0 && b === 0) { data[idx + 3] = 255; continue; }
        if (r === 255 && g === 255 && b === 255) { data[idx + 3] = 255; continue; }

        // RGB → HSL 增强饱和度
        var rr = r / 255, gg = g / 255, bb = b / 255;
        var max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
        var l = (max + min) / 2;
        var s, h;

        if (max === min) {
          s = 0; h = 0;
        } else {
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === rr) {
            h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
          } else if (max === gg) {
            h = ((bb - rr) / d + 2) / 6;
          } else {
            h = ((rr - gg) / d + 4) / 6;
          }
        }

        // 饱和度提升 15%，亮度对比度增强
        s = Math.min(1, s * 1.15);
        if (l < 0.5) l = Math.max(0, l * 0.95);
        else l = Math.min(1, l * 1.05);

        // HSL → RGB
        function hue2rgb(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;

        r = Math.round(255 * hue2rgb(p, q, h + 1/3));
        g = Math.round(255 * hue2rgb(p, q, h));
        b = Math.round(255 * hue2rgb(p, q, h - 1/3));

        data[idx] = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = 255;
      }
    }

    return imageData;
  }

  // ==================== 主流程 ====================

  function generatePixelArt(imageSource, options) {
    var opts = options || {};
    var pixelSize = opts.pixelSize || 8;
    var colorCount = opts.colorCount || 16;
    var outline = opts.outline !== undefined ? opts.outline : true;
    var symmetry = opts.symmetry !== undefined ? opts.symmetry : true;

    var sourcePromise;
    if (imageSource instanceof Blob) {
      sourcePromise = new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error(window.App.t('error.blobReadFailed'))); };
        reader.readAsDataURL(imageSource);
      });
    } else {
      sourcePromise = Promise.resolve(imageSource);
    }

    return sourcePromise.then(function (source) {
      return getImageDataFromSource(source);
    }).then(function (imageData) {
      var w = imageData.width;
      var h = imageData.height;

      // 复杂度检测
      var complexity = analyzeImageComplexity(imageData);

      if (complexity.level === 'error') {
        var err = new Error(window.App.t('error.complexImage'));
        err.code = 'SUBJECT_TOO_SMALL';
        throw err;
      }

      // Step 1: 对称增强
      if (symmetry) {
        imageData = enhanceSymmetry(imageData, w, h);
      }

      // Step 2: 分块取色
      var pixelated = pixelate(imageData, pixelSize);

      // Step 3: 关键特征检测
      var keyFeatureMap = detectKeyFeatures(pixelated, w, h);

      // Step 4: 加权色板量化
      var quantized;
      if (complexity.level === 'simple' && complexity.uniqueColors <= SIMPLE_SKIP_PALETTE_COLORS) {
        quantized = pixelated;
      } else {
        var effectiveColorCount = complexity.level === 'complex' ? Math.min(colorCount, 16) : colorCount;
        quantized = applyPalette(pixelated, effectiveColorCount, keyFeatureMap);
      }

      // Step 5: 轮廓增强
      var result;
      if (outline) {
        result = applyOutline(quantized, pixelSize);
      } else {
        result = quantized;
      }

      // Step 6: 色彩增强
      result = enhanceColors(result, w, h);

      // 输出
      var canvas = document.createElement('canvas');
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      var ctx = canvas.getContext('2d');
      ctx.putImageData(result, 0, 0);
      var dataURL = canvas.toDataURL('image/png');

      return {
        dataURL: dataURL,
        pixelSize: pixelSize,
        colorCount: colorCount,
        outline: outline,
        symmetry: symmetry,
        complexity: complexity.level
      };
    });
  }

  // ==================== 暴露API ====================

  window.App = window.App || {};
  window.App.pixelate = {
    loadImageToDataURL: loadImageToDataURL,
    generatePixelArt: generatePixelArt
  };

})();
