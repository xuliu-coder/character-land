// canvas-editor.js — 场景编辑器（Canvas操作）

(function () {
  'use strict';

  var canvas = document.getElementById('scene-canvas');
  var ctx = canvas.getContext('2d');
  var wrapper = document.getElementById('canvas-wrapper');

  var CANVAS_W = 800;
  var CANVAS_H = 600;
  var GRID_SIZE = 20;
  var CHAR_SIZE = 64; // 角色在画布上的默认显示尺寸

  // ==================== 5.1 / 5.2 画布初始化 ====================

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.style.minWidth = CANVAS_W + 'px';
  canvas.style.minHeight = CANVAS_H + 'px';

  // ==================== 状态管理 ====================

  var placements = [];       // 当前画布上的所有角色摆放
  var selectedId = null;     // 当前选中的 placement id
  var currentTemplate = 'grid';
  var historyStack = [];     // 撤销栈
  var redoStack = [];        // 重做栈
  var characterCache = {};   // 角色数据缓存 { charId: characterData }
  var mouseState = {         // 鼠标交互状态
    action: null,            // null | 'move'
    targetId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0
  };

  // ==================== 5.7 场景模板绘制 ====================

  function drawTemplate() {
    switch (currentTemplate) {
      case 'grid':
        drawGridBackground();
        break;
      case 'living-room':
        drawLivingRoom();
        break;
      case 'grassland':
        drawGrassland();
        break;
      case 'beach':
        drawBeach();
        break;
      default:
        drawGridBackground();
    }
  }

  function drawGridBackground() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 0.5;
    for (var x = 0; x <= CANVAS_W; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (var y = 0; y <= CANVAS_H; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }

  function drawLivingRoom() {
    // 背景墙
    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 地板
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(0, 380, CANVAS_W, 220);
    // 地板线条
    ctx.strokeStyle = '#C49A6C';
    ctx.lineWidth = 1;
    for (var y = 380; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // 窗户
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(520, 80, 180, 160);
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 6;
    ctx.strokeRect(520, 80, 180, 160);
    ctx.beginPath(); ctx.moveTo(610, 80); ctx.lineTo(610, 240); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(520, 160); ctx.lineTo(700, 160); ctx.stroke();

    // 沙发
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(120, 350, 280, 100);
    ctx.fillRect(100, 330, 320, 40);
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(140, 360, 60, 60);
    ctx.fillRect(320, 360, 60, 60);

    // 地毯
    ctx.fillStyle = '#E8D5B7';
    ctx.fillRect(180, 420, 200, 120);
    ctx.strokeStyle = '#C4A574';
    ctx.lineWidth = 2;
    ctx.strokeRect(180, 420, 200, 120);

    // 网格覆盖
    drawGridOverlay();
  }

  function drawGrassland() {
    // 天空
    var skyGrad = ctx.createLinearGradient(0, 0, 0, 350);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#E0F0FF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, 380);

    // 云朵
    drawCloud(150, 80, 0.9);
    drawCloud(500, 60, 1.0);
    drawCloud(650, 120, 0.7);

    // 草地
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(0, 350, CANVAS_W, 250);
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, 350, CANVAS_W, 30);

    // 小花
    drawFlower(100, 420);
    drawFlower(250, 460);
    drawFlower(400, 400);
    drawFlower(550, 450);
    drawFlower(680, 420);

    // 网格覆盖
    drawGridOverlay();
  }

  function drawCloud(x, y, scale) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    var s = scale;
    ctx.beginPath();
    ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s, y - 8 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, y, 20 * s, 0, Math.PI * 2);
    ctx.arc(x + 15 * s, y + 5 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFlower(x, y) {
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF9800';
    ctx.beginPath(); ctx.arc(x + 5, y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 5, y - 3, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawBeach() {
    // 天空
    ctx.fillStyle = '#B3E5FC';
    ctx.fillRect(0, 0, CANVAS_W, 300);

    // 太阳
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath(); ctx.arc(650, 100, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath(); ctx.arc(650, 100, 30, 0, Math.PI * 2); ctx.fill();

    // 海水
    ctx.fillStyle = '#4FC3F7';
    ctx.fillRect(0, 280, CANVAS_W, 100);
    ctx.fillStyle = '#29B6F6';
    ctx.fillRect(0, 320, CANVAS_W, 60);

    // 沙滩
    ctx.fillStyle = '#FFE082';
    ctx.fillRect(0, 360, CANVAS_W, 240);
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(0, 360, CANVAS_W, 15);

    // 海浪
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (var wx = 0; wx < CANVAS_W; wx += 60) {
      ctx.beginPath();
      ctx.moveTo(wx, 340);
      ctx.quadraticCurveTo(wx + 30, 330, wx + 60, 340);
      ctx.stroke();
    }

    // 贝壳
    drawShell(200, 420);
    drawShell(500, 470);
    drawShell(680, 400);

    // 网格覆盖
    drawGridOverlay();
  }

  function drawShell(x, y) {
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#BCAAA4';
    ctx.lineWidth = 1;
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6 + i * 4, y - 5);
      ctx.stroke();
    }
  }

  function drawGridOverlay() {
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 0.5;
    for (var x = 0; x <= CANVAS_W; x += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (var y = 0; y <= CANVAS_H; y += GRID_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }
  }

  // ==================== 渲染主循环 ====================

  var renderRAF = null;

  function render() {
    if (renderRAF) return;
    renderRAF = requestAnimationFrame(function () {
      renderRAF = null;
      try {
        // 绘制背景模板
        drawTemplate();

        // 绘制所有角色（按 zIndex 排序）
        var sorted = placements.slice().sort(function (a, b) {
          return (a.zIndex || 0) - (b.zIndex || 0);
        });

        sorted.forEach(function (p) {
          drawPlacement(p, p.id === selectedId);
        });
      } catch (e) {
        console.error('[Canvas] 渲染出错:', e);
      }
    });
  }

  function drawPlacement(p, isSelected) {
    var charData = characterCache[p.characterId];
    if (!charData || !charData.pixelImage) return;

    var size = CHAR_SIZE * (p.scale || 1);
    var cx = p.x;
    var cy = p.y;
    var rot = p.rotation || 0;

    ctx.save();
    ctx.translate(cx, cy);
    if (rot !== 0) {
      ctx.rotate(rot * Math.PI / 180);
    }

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(-size / 2 + 3, -size / 2 + 3, size, size);

    // 加载角色图片
    var img = charData._img;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else if (img && !img.complete) {
      // 正在加载中，绘制占位
      ctx.fillStyle = '#BDBDBD';
      ctx.fillRect(-size / 2, -size / 2, size, size);
    } else {
      // 首次加载
      var newImg = new Image();
      newImg.src = charData.pixelImage;
      charData._img = newImg;
      // 占位矩形
      ctx.fillStyle = '#BDBDBD';
      ctx.fillRect(-size / 2, -size / 2, size, size);
      newImg.onload = function () { render(); };
      newImg.onerror = function () {
        charData._img = null;
        render();
      };
    }

    // 选中框
    if (isSelected) {
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(-size / 2 - 3, -size / 2 - 3, size + 6, size + 6);
      ctx.setLineDash([]);
    }

    // 名称标签
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(charData.name, 0, -size / 2 - 8);

    ctx.restore();
  }

  // ==================== 5.3 添加角色到画布 ====================

  function addCharacterToCanvas(characterId, x, y) {
    // 对齐到网格
    x = Math.round(x / GRID_SIZE) * GRID_SIZE;
    y = Math.round(y / GRID_SIZE) * GRID_SIZE;

    // 限制在画布内
    x = Math.max(CHAR_SIZE / 2, Math.min(CANVAS_W - CHAR_SIZE / 2, x));
    y = Math.max(CHAR_SIZE / 2, Math.min(CANVAS_H - CHAR_SIZE / 2, y));

    // 确保角色数据已缓存
    if (!characterCache[characterId]) {
      window.App.db.getCharacter(characterId).then(function (c) {
        if (c) {
          characterCache[characterId] = c;
        }
      });
    }

    pushHistory();

    var placement = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      characterId: characterId,
      x: x,
      y: y,
      rotation: 0,
      scale: 1,
      zIndex: placements.length
    };

    placements.push(placement);
    selectPlacement(placement.id);
    render();
    updatePropsPanel();
  }

  // ==================== 5.4 选中与移动 ====================

  function selectPlacement(id) {
    selectedId = id;
    updatePropsPanel();
    updateDeleteButton();
    render();
  }

  function deselectAll() {
    selectedId = null;
    updatePropsPanel();
    updateDeleteButton();
    render();
  }

  function findPlacementAt(x, y) {
    // 从上到下查找（后添加的在上面）
    for (var i = placements.length - 1; i >= 0; i--) {
      var p = placements[i];
      var size = CHAR_SIZE * (p.scale || 1);
      var half = size / 2;
      if (x >= p.x - half && x <= p.x + half &&
          y >= p.y - half && y <= p.y + half) {
        return p;
      }
    }
    return null;
  }

  canvas.addEventListener('mousedown', function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var hit = findPlacementAt(mx, my);

    if (hit) {
      selectPlacement(hit.id);
      mouseState.action = 'move';
      mouseState.targetId = hit.id;
      mouseState.startX = mx;
      mouseState.startY = my;
      mouseState.origX = hit.x;
      mouseState.origY = hit.y;
      canvas.style.cursor = 'grabbing';
    } else {
      deselectAll();
    }
  });

  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    if (mouseState.action === 'move') {
      var dx = mx - mouseState.startX;
      var dy = my - mouseState.startY;
      var newX = mouseState.origX + dx;
      var newY = mouseState.origY + dy;

      // 对齐网格
      newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

      // 边界限制
      newX = Math.max(CHAR_SIZE / 2, Math.min(CANVAS_W - CHAR_SIZE / 2, newX));
      newY = Math.max(CHAR_SIZE / 2, Math.min(CANVAS_H - CHAR_SIZE / 2, newY));

      var p = placements.find(function (pl) { return pl.id === mouseState.targetId; });
      if (p && (p.x !== newX || p.y !== newY)) {
        p.x = newX;
        p.y = newY;
        render();
        updatePropsPanel();
      }
    } else {
      // 悬停检测
      var hit = findPlacementAt(mx, my);
      canvas.style.cursor = hit ? 'grab' : 'default';
    }
  });

  document.addEventListener('mouseup', function () {
    if (mouseState.action === 'move') {
      mouseState.action = null;
      mouseState.targetId = null;
      canvas.style.cursor = 'default';
    }
  });

  // ==================== 5.5 旋转和缩放 ====================

  function rotateSelected(delta) {
    var p = placements.find(function (pl) { return pl.id === selectedId; });
    if (!p) return;
    pushHistory();
    p.rotation = ((p.rotation || 0) + delta) % 360;
    if (p.rotation < 0) p.rotation += 360;
    render();
    updatePropsPanel();
  }

  function scaleSelected(delta) {
    var p = placements.find(function (pl) { return pl.id === selectedId; });
    if (!p) return;
    pushHistory();
    var newScale = (p.scale || 1) + delta;
    p.scale = Math.max(0.5, Math.min(2.0, Math.round(newScale * 10) / 10));
    render();
    updatePropsPanel();
  }

  function setSelectedProperties(props) {
    var p = placements.find(function (pl) { return pl.id === selectedId; });
    if (!p) return;
    pushHistory();
    if (props.x !== undefined) p.x = props.x;
    if (props.y !== undefined) p.y = props.y;
    if (props.rotation !== undefined) p.rotation = props.rotation;
    if (props.scale !== undefined) p.scale = props.scale;
    if (props.zIndex !== undefined) p.zIndex = props.zIndex;
    render();
    updatePropsPanel();
  }

  function deleteSelected() {
    var p = placements.find(function (pl) { return pl.id === selectedId; });
    if (!p) return;
    pushHistory();
    placements = placements.filter(function (pl) { return pl.id !== selectedId; });
    selectedId = null;
    render();
    updatePropsPanel();
    updateDeleteButton();
  }

  // ==================== 5.6 属性面板绑定 ====================

  var propsPanel = document.getElementById('props-panel');
  var deleteBtn = document.getElementById('delete-selected-btn');

  function updatePropsPanel() {
    var p = placements.find(function (pl) { return pl.id === selectedId; });
    if (!p) {
      propsPanel.innerHTML = '<p class="text-xs text-secondary text-center py-8">点击画布上的角色查看属性</p>';
      return;
    }

    var charData = characterCache[p.characterId];
    var name = charData ? charData.name : '未知角色';

    propsPanel.innerHTML = ''
      + '<div>'
      + '  <label class="block text-secondary mb-1 text-xs">名称</label>'
      + '  <p class="text-sm font-medium truncate">' + escapeHtml(name) + '</p>'
      + '</div>'
      + '<div>'
      + '  <label class="block text-secondary mb-1 text-xs">位置</label>'
      + '  <div class="grid grid-cols-2 gap-2">'
      + '    <div><span class="text-secondary text-xs">X:</span>'
      + '      <input type="number" id="prop-x" value="' + Math.round(p.x) + '" class="w-full px-2 py-1 border border-border rounded text-xs" min="0" max="' + CANVAS_W + '">'
      + '    </div>'
      + '    <div><span class="text-secondary text-xs">Y:</span>'
      + '      <input type="number" id="prop-y" value="' + Math.round(p.y) + '" class="w-full px-2 py-1 border border-border rounded text-xs" min="0" max="' + CANVAS_H + '">'
      + '    </div>'
      + '  </div>'
      + '</div>'
      + '<div>'
      + '  <label class="block text-secondary mb-1 text-xs">旋转 (' + Math.round(p.rotation || 0) + '°)</label>'
      + '  <input type="range" id="prop-rotation" value="' + (p.rotation || 0) + '" min="0" max="360" class="w-full">'
      + '</div>'
      + '<div>'
      + '  <label class="block text-secondary mb-1 text-xs">缩放 (' + Math.round((p.scale || 1) * 100) + '%)</label>'
      + '  <input type="range" id="prop-scale" value="' + ((p.scale || 1) * 100) + '" min="50" max="200" class="w-full">'
      + '</div>'
      + '<div class="flex space-x-2">'
      + '  <button id="prop-up" class="flex-1 px-2 py-1 bg-white border border-border rounded text-xs hover:bg-bgLight">置顶</button>'
      + '  <button id="prop-down" class="flex-1 px-2 py-1 bg-white border border-border rounded text-xs hover:bg-bgLight">置底</button>'
      + '</div>';

    // 绑定属性面板事件
    document.getElementById('prop-x').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!isNaN(v)) setSelectedProperties({ x: Math.max(0, Math.min(CANVAS_W, v)) });
    });
    document.getElementById('prop-y').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!isNaN(v)) setSelectedProperties({ y: Math.max(0, Math.min(CANVAS_H, v)) });
    });
    document.getElementById('prop-rotation').addEventListener('input', function () {
      var p2 = placements.find(function (pl) { return pl.id === selectedId; });
      if (p2) { p2.rotation = parseInt(this.value, 10); render(); }
    });
    document.getElementById('prop-scale').addEventListener('input', function () {
      var p2 = placements.find(function (pl) { return pl.id === selectedId; });
      if (p2) { p2.scale = parseInt(this.value, 10) / 100; render(); }
    });
    document.getElementById('prop-up').addEventListener('click', function () {
      setSelectedProperties({ zIndex: placements.length });
    });
    document.getElementById('prop-down').addEventListener('click', function () {
      setSelectedProperties({ zIndex: 0 });
    });
  }

  function updateDeleteButton() {
    if (selectedId) {
      deleteBtn.classList.remove('hidden');
    } else {
      deleteBtn.classList.add('hidden');
    }
  }

  deleteBtn.addEventListener('click', function () {
    deleteSelected();
  });

  // ==================== 5.8 撤销/重做 ====================

  var undoBtn = document.getElementById('undo-btn');
  var redoBtn = document.getElementById('redo-btn');

  function pushHistory() {
    historyStack.push(JSON.stringify(placements));
    redoStack = [];
    updateUndoRedoButtons();
  }

  function undo() {
    if (historyStack.length === 0) return;
    redoStack.push(JSON.stringify(placements));
    placements = JSON.parse(historyStack.pop());
    selectedId = null;
    updateUndoRedoButtons();
    updatePropsPanel();
    updateDeleteButton();
    render();
  }

  function redo() {
    if (redoStack.length === 0) return;
    historyStack.push(JSON.stringify(placements));
    placements = JSON.parse(redoStack.pop());
    selectedId = null;
    updateUndoRedoButtons();
    updatePropsPanel();
    updateDeleteButton();
    render();
  }

  function updateUndoRedoButtons() {
    undoBtn.disabled = historyStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      redo();
    }
  });

  // ==================== 场景模板选择 ====================

  document.querySelectorAll('.scene-template-item').forEach(function (item) {
    item.addEventListener('click', function () {
      document.querySelectorAll('.scene-template-item').forEach(function (el) {
        el.classList.remove('border-primary', 'border-2');
        el.classList.add('border', 'border-border');
      });
      this.classList.remove('border', 'border-border');
      this.classList.add('border-2', 'border-primary');

      currentTemplate = this.getAttribute('data-template');
      pushHistory();
      render();
    });
  });

  // ==================== 场景保存 / 加载 / CRUD ====================

  var SCENES_KEY = 'character-land-scenes';

  function getAllScenes() {
    try {
      return JSON.parse(localStorage.getItem(SCENES_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveAllScenes(scenes) {
    localStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
  }

  document.getElementById('save-scene-btn').addEventListener('click', function () {
    if (placements.length === 0) {
      window.App.showError('保存失败', '场景中没有角色，请先从左侧拖入角色');
      return;
    }

    var defaultName = '场景 ' + new Date().toLocaleDateString('zh-CN');
    var name = prompt('请输入场景名称：', defaultName);
    if (!name || !name.trim()) return;
    name = name.trim();

    var now = new Date().toISOString();
    var sceneData = {
      id: crypto.randomUUID(),
      name: name,
      template: currentTemplate,
      placements: JSON.parse(JSON.stringify(placements)),
      characterCount: placements.length,
      createdAt: now,
      updatedAt: now
    };

    var scenes = getAllScenes();

    // 检查同名场景，询问是否覆盖
    var existingIdx = -1;
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].name === name) {
        existingIdx = i;
        break;
      }
    }
    if (existingIdx >= 0) {
      if (!confirm('已存在同名场景「' + name + '」，是否覆盖？')) return;
      sceneData.id = scenes[existingIdx].id;
      sceneData.createdAt = scenes[existingIdx].createdAt;
      scenes[existingIdx] = sceneData;
    } else {
      scenes.push(sceneData);
    }

    saveAllScenes(scenes);
    window.App.showSuccess('场景「' + name + '」已保存');
    window.App.analytics.track('scene_save', {
      character_count: placements.length,
      template: currentTemplate
    });
  });

  document.getElementById('new-scene-btn').addEventListener('click', function () {
    if (placements.length > 0) {
      if (!confirm('创建新场景将清除当前画布上的所有角色，是否继续？')) return;
    }
    window.App.analytics.track('scene_create');
    pushHistory();
    placements = [];
    selectedId = null;
    currentTemplate = 'grid';
    document.querySelectorAll('.scene-template-item').forEach(function (el) {
      el.classList.remove('border-primary', 'border-2');
      el.classList.add('border', 'border-border');
    });
    var gridItem = document.querySelector('[data-template="grid"]');
    if (gridItem) {
      gridItem.classList.remove('border', 'border-border');
      gridItem.classList.add('border-2', 'border-primary');
    }
    updatePropsPanel();
    updateDeleteButton();
    render();
  });

  function loadSceneById(id) {
    var scenes = getAllScenes();
    var found = null;
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === id) { found = scenes[i]; break; }
    }
    if (!found) {
      window.App.showError('加载失败', '场景不存在');
      return;
    }

    currentTemplate = found.template || 'grid';
    placements = JSON.parse(JSON.stringify(found.placements || []));
    selectedId = null;

    // 恢复模板高亮
    document.querySelectorAll('.scene-template-item').forEach(function (el) {
      el.classList.remove('border-primary', 'border-2');
      el.classList.add('border', 'border-border');
    });
    var activeItem = document.querySelector('[data-template="' + currentTemplate + '"]');
    if (activeItem) {
      activeItem.classList.remove('border', 'border-border');
      activeItem.classList.add('border-2', 'border-primary');
    }

    // 加载角色缓存
    window.App.db.getAllCharacters().then(function (chars) {
      chars.forEach(function (c) { characterCache[c.id] = c; });
      refreshCharacterList();
      updatePropsPanel();
      updateDeleteButton();
      render();
    });

    // 切换到场景编辑 Tab
    window.App.switchTab('scene');
  }

  function deleteScene(id) {
    var scenes = getAllScenes();
    var newScenes = [];
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id !== id) newScenes.push(scenes[i]);
    }
    saveAllScenes(newScenes);
  }

  function renameScene(id, newName) {
    var scenes = getAllScenes();
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === id) {
        scenes[i].name = newName;
        scenes[i].updatedAt = new Date().toISOString();
        break;
      }
    }
    saveAllScenes(scenes);
  }

  // ==================== 6.0 导出场景 ====================

  document.getElementById('export-scene-btn').addEventListener('click', function () {
    window.App.analytics.track('scene_export', {
      character_count: placements.length,
      template: currentTemplate
    });

    var exportBtn = this;
    exportBtn.disabled = true;
    exportBtn.textContent = '导出中...';

    // 先预加载所有角色图片，避免导出时出现灰色占位框
    preloadAllPlacementImages().then(function () {
      var exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_W;
      exportCanvas.height = CANVAS_H;
      var exportCtx = exportCanvas.getContext('2d');

      var origCtx = ctx;
      var origCanvas = canvas;
      ctx = exportCtx;
      canvas = { width: CANVAS_W, height: CANVAS_H };

      drawTemplate();

      var sorted = placements.slice().sort(function (a, b) {
        return (a.zIndex || 0) - (b.zIndex || 0);
      });
      sorted.forEach(function (p) {
        drawPlacement(p, false);
      });

      ctx = origCtx;
      canvas = origCanvas;

      var link = document.createElement('a');
      link.download = 'character-land-scene-' + Date.now() + '.png';
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
      window.App.showSuccess('场景图片已导出');
    }).catch(function () {
      window.App.showError('导出失败', '角色图片加载失败，请重试');
    }).then(function () {
      exportBtn.disabled = false;
      exportBtn.textContent = '导出场景图片';
    });
  });

  // 预加载画布上所有角色图片，确保导出时不会出现灰色占位框
  function preloadAllPlacementImages() {
    var loadPromises = [];
    placements.forEach(function (p) {
      var charData = characterCache[p.characterId];
      if (!charData || !charData.pixelImage) return;

      if (!charData._img || !charData._img.complete || charData._img.naturalWidth === 0) {
        var promise = new Promise(function (resolve, reject) {
          var img = new Image();
          img.onload = function () {
            charData._img = img;
            resolve();
          };
          img.onerror = function () {
            charData._img = null;
            reject(new Error('图片加载失败'));
          };
          img.src = charData.pixelImage;
        });
        loadPromises.push(promise);
      }
    });

    if (loadPromises.length === 0) {
      return Promise.resolve();
    }
    return Promise.all(loadPromises);
  }

  // ==================== 初始化与角色库加载 ====================

  function refreshCharacterList() {
    var listEl = document.getElementById('scene-char-list');
    window.App.db.getAllCharacters().then(function (characters) {
      characterCache = {};
      characters.forEach(function (c) { characterCache[c.id] = c; });

      if (characters.length === 0) {
        listEl.innerHTML = '<p class="col-span-2 text-xs text-secondary text-center py-4">暂无角色</p>';
        return;
      }

      var html = '';
      characters.forEach(function (c) {
        html += ''
          + '<div class="scene-char-item bg-white border border-border rounded p-2 text-center cursor-grab hover:shadow transition-shadow" draggable="true" data-char-id="' + c.id + '">'
          + '  <div class="w-full h-10 flex items-center justify-center mb-1">'
          + '    <img src="' + c.pixelImage + '" alt="' + escapeHtml(c.name) + '" class="max-h-full max-w-full object-contain pixel-art">'
          + '  </div>'
          + '  <p class="text-xs truncate" title="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</p>'
          + '</div>';
      });
      listEl.innerHTML = html;

      // 绑定拖拽事件
      listEl.querySelectorAll('.scene-char-item').forEach(function (item) {
        item.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', this.getAttribute('data-char-id'));
          e.dataTransfer.effectAllowed = 'copy';
          this.style.opacity = '0.5';
        });
        item.addEventListener('dragend', function () {
          this.style.opacity = '1';
        });
        // 双击添加
        item.addEventListener('dblclick', function () {
          var charId = this.getAttribute('data-char-id');
          addCharacterToCanvas(charId, CANVAS_W / 2, CANVAS_H / 2 - 100 + Math.random() * 200);
        });
      });
    });
  }

  // Canvas接收拖放
  canvas.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    var charId = e.dataTransfer.getData('text/plain');
    if (!charId) return;

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    addCharacterToCanvas(charId, x, y);
  });

  // ==================== 初始化 ====================

  // 等待数据库就绪后加载角色缓存
  window.App.db.ready.then(function () {
    return window.App.db.getAllCharacters();
  }).then(function (chars) {
    chars.forEach(function (c) { characterCache[c.id] = c; });
    refreshCharacterList();
  });

  render();

  // 切换到场景编辑Tab时刷新
  var sceneTab = document.getElementById('tab-scene');
  if (sceneTab) {
    sceneTab.addEventListener('click', function () {
      refreshCharacterList();
      setTimeout(function () { render(); }, 200);
    });
  }

  // ==================== 工具 ====================

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 暴露API ====================

  window.App.scene = {
    render: render,
    addCharacter: addCharacterToCanvas,
    getPlacements: function () { return placements; },
    refreshCharacters: refreshCharacterList,
    getAll: getAllScenes,
    loadById: loadSceneById,
    delete: deleteScene,
    rename: renameScene
  };

})();
