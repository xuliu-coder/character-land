// app.js — 应用初始化 & Tab切换 & 资源管理

(function () {
  'use strict';

  // ==================== 8.1 Polyfill ====================

  if (!crypto.randomUUID) {
    crypto.randomUUID = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
  }

  // ==================== 7.2 启动检测 ====================

  function runStartupChecks() {
    if (!window.App || !window.App.db) return;

    // 存储空间检测 + 上报存储模式
    window.App.db.ready.then(function (status) {
      if (status && status.fallback) {
        console.warn('[Character Land] 使用 LocalStorage 降级方案');
      }
      window.App.analytics.track('storage_mode', {
        mode: (status && status.fallback) ? 'localstorage' : 'indexeddb'
      });
    });

    window.App.db.checkStorageSpace().then(function (result) {
      if (result.warning) {
        setTimeout(function () {
          window.App.showError(window.App.t('storage.title'), result.message);
        }, 500);
      }
    });

    // 移动端检测
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      var banner = document.getElementById('mobile-banner');
      if (banner) banner.classList.remove('hidden');
    }
  }

  // 延迟执行启动检测，确保依赖脚本已全部加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { runStartupChecks(); });
  } else {
    runStartupChecks();
  }

  // ==================== 状态 ====================

  var currentEditId = null;
  var currentDeleteId = null;

  // ==================== Tab 切换 ====================

  function switchTab(tabName) {
    var titles = {};
    titles.character = window.App.t('tab.character');
    titles.scene = window.App.t('tab.scene');
    titles.resource = window.App.t('tab.resource');
    window.App.analytics.trackPageView(titles[tabName] || tabName);
    window.App.analytics.track('tab_switch', { tab: tabName });

    document.querySelectorAll('.page-section').forEach(function (s) { s.classList.add('hidden'); });
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.remove('tab-active');
      b.classList.add('text-secondary', 'hover:text-primary', 'hover:bg-bgLight');
    });

    var page = document.getElementById('page-' + tabName);
    if (page) page.classList.remove('hidden');

    var tab = document.getElementById('tab-' + tabName);
    if (tab) {
      tab.classList.add('tab-active');
      tab.classList.remove('text-secondary', 'hover:text-primary', 'hover:bg-bgLight');
    }

    // 切换到资源管理时自动刷新角色列表和场景列表
    if (tabName === 'resource') {
      loadCharacters();
      loadScenes();
    }
  }

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(this.getAttribute('data-tab'));
    });
  });

  // ==================== 资源管理标签切换 ====================

  document.getElementById('tab-characters').addEventListener('click', function () {
    document.getElementById('resource-characters').classList.remove('hidden');
    document.getElementById('resource-scenes').classList.add('hidden');
    this.classList.add('tab-active');
    this.classList.remove('text-secondary', 'hover:text-primary');
    document.getElementById('tab-scenes').classList.remove('tab-active');
    document.getElementById('tab-scenes').classList.add('text-secondary', 'hover:text-primary');
    loadCharacters();
  });

  document.getElementById('tab-scenes').addEventListener('click', function () {
    document.getElementById('resource-scenes').classList.remove('hidden');
    document.getElementById('resource-characters').classList.add('hidden');
    this.classList.add('tab-active');
    this.classList.remove('text-secondary', 'hover:text-primary');
    document.getElementById('tab-characters').classList.remove('tab-active');
    document.getElementById('tab-characters').classList.add('text-secondary', 'hover:text-primary');
    loadScenes();
  });

  // ==================== 4.3 角色列表加载与渲染 ====================

  var characterGrid = document.getElementById('character-grid');
  var characterCount = document.getElementById('character-count');
  var searchInput = document.getElementById('search-character');
  var filterSelect = document.getElementById('filter-source');

  var allCharacters = [];

  function loadCharacters() {
    window.App.db.getAllCharacters().then(function (characters) {
      allCharacters = characters;
      updateSourceFilter(characters);
      renderCharacterGrid(characters);
    }).catch(function () {
      characterGrid.innerHTML = '<p class="col-span-full text-center text-error py-12">' + window.App.t('resource.loadError') + '</p>';
    });
  }

  function updateSourceFilter(characters) {
    var sources = [];
    characters.forEach(function (c) {
      if (c.source && sources.indexOf(c.source) === -1) {
        sources.push(c.source);
      }
    });

    var currentValue = filterSelect.value;
    filterSelect.innerHTML = '<option value="">' + window.App.t('resource.allSources') + '</option>';
    sources.forEach(function (s) {
      var selected = s === currentValue ? ' selected' : '';
      filterSelect.innerHTML += '<option value="' + escapeHtml(s) + '"' + selected + '>' + escapeHtml(s) + '</option>';
    });
  }

  function getFilteredCharacters() {
    var keyword = searchInput.value.trim().toLowerCase();
    var sourceFilter = filterSelect.value;

    return allCharacters.filter(function (c) {
      var matchName = !keyword || c.name.toLowerCase().indexOf(keyword) !== -1;
      var matchSource = !sourceFilter || c.source === sourceFilter;
      return matchName && matchSource;
    });
  }

  function renderCharacterGrid(characters) {
    characterCount.textContent = window.App.t('resource.characterCount', characters.length);

    if (characters.length === 0) {
      characterGrid.innerHTML = '<p class="col-span-full text-center text-secondary py-12">' + window.App.t('resource.noCharacters') + '</p>';
      return;
    }

    var html = '';
    characters.forEach(function (c) {
      html += ''
        + '<div class="bg-bgLight rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">'
        + '  <div class="h-32 checkerboard-bg flex items-center justify-center p-2">'
        + '    <img src="' + c.pixelImage + '" alt="' + escapeHtml(c.name) + '" class="max-h-full max-w-full object-contain pixel-art">'
        + '  </div>'
        + '  <div class="p-3">'
        + '    <h4 class="font-medium text-sm truncate" title="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</h4>'
        + '    <p class="text-xs text-secondary mb-2 truncate">' + (c.source ? window.App.t('resource.source') + escapeHtml(c.source) : window.App.t('resource.noSource')) + '</p>'
        + '    <div class="flex space-x-1">'
        + '      <button class="flex-1 px-2 py-1 bg-white border border-border rounded text-xs hover:bg-bgLight transition-colors edit-btn" data-id="' + c.id + '">' + window.App.t('resource.edit') + '</button>'
        + '      <button class="flex-1 px-2 py-1 bg-white border border-border rounded text-xs hover:bg-bgLight transition-colors export-btn" data-id="' + c.id + '">' + window.App.t('resource.export') + '</button>'
        + '      <button class="px-2 py-1 bg-white text-error border border-error rounded text-xs hover:bg-error hover:text-white transition-colors delete-btn" data-id="' + c.id + '">' + window.App.t('resource.delete') + '</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';
    });

    characterGrid.innerHTML = html;

    // 绑定按钮事件
    characterGrid.querySelectorAll('.edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEditModal(this.getAttribute('data-id'));
      });
    });

    characterGrid.querySelectorAll('.export-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        exportCharacterImage(this.getAttribute('data-id'));
      });
    });

    characterGrid.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDeleteModal(this.getAttribute('data-id'));
      });
    });
  }

  // ==================== 搜索与筛选 ====================

  var searchTimer = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      renderCharacterGrid(getFilteredCharacters());
    }, 150);
  });

  filterSelect.addEventListener('change', function () {
    renderCharacterGrid(getFilteredCharacters());
  });

  // ==================== 4.4 编辑角色 ====================

  var editModal = document.getElementById('edit-modal');
  var editName = document.getElementById('edit-name');
  var editSource = document.getElementById('edit-source');
  var editDesc = document.getElementById('edit-desc');
  var editQuote = document.getElementById('edit-quote');
  var editId = document.getElementById('edit-character-id');

  function openEditModal(id) {
    window.App.db.getCharacter(id).then(function (c) {
      if (!c) {
        window.App.showError(window.App.t('error.editFailed'), window.App.t('error.charNotFound'));
        return;
      }
      currentEditId = id;
      editId.value = id;
      editName.value = c.name || '';
      editSource.value = c.source || '';
      editDesc.value = c.description || '';
      editQuote.value = c.quote || '';
      editModal.classList.remove('hidden');
    });
  }

  function closeEditModal() {
    editModal.classList.add('hidden');
    currentEditId = null;
  }

  document.getElementById('edit-cancel-btn').addEventListener('click', closeEditModal);
  editModal.addEventListener('click', function (e) {
    if (e.target === editModal) closeEditModal();
  });

  document.getElementById('edit-save-btn').addEventListener('click', function () {
    var name = editName.value.trim();
    if (!name) {
      window.App.showError(window.App.t('error.saveFailed'), window.App.t('error.nameRequired'));
      return;
    }

    window.App.db.updateCharacter(currentEditId, {
      name: name,
      source: editSource.value.trim(),
      description: editDesc.value.trim(),
      quote: editQuote.value.trim()
    }).then(function () {
      closeEditModal();
      window.App.showSuccess(window.App.t('success.charUpdated', name));
      window.App.analytics.track('character_edit');
      loadCharacters();
    }).catch(function (err) {
      window.App.showError(window.App.t('error.saveFailed'), err.message || window.App.t('error.updateFailed'));
    });
  });

  // ==================== 4.4 删除角色 ====================

  var deleteModal = document.getElementById('delete-modal');
  var deleteMessage = document.getElementById('delete-message');
  var deleteId = document.getElementById('delete-character-id');

  function openDeleteModal(id) {
    window.App.db.getCharacter(id).then(function (c) {
      if (!c) return;
      currentDeleteId = id;
      deleteId.value = id;
      deleteMessage.textContent = window.App.t('delete.charConfirm', c.name);
      deleteModal.classList.remove('hidden');
    });
  }

  function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    currentDeleteId = null;
  }

  document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', function (e) {
    if (e.target === deleteModal) closeDeleteModal();
  });

  document.getElementById('delete-confirm-btn').addEventListener('click', function () {
    if (!currentDeleteId) return;

    window.App.db.deleteCharacter(currentDeleteId).then(function () {
      closeDeleteModal();
      window.App.showSuccess(window.App.t('success.charDeleted'));
      window.App.analytics.track('character_delete');
      loadCharacters();
    }).catch(function (err) {
      window.App.showError(window.App.t('error.deleteFailed'), err.message || window.App.t('error.deleteCharFailed'));
    });
  });

  // ==================== 导出单角色 ====================

  function exportCharacterImage(id) {
    window.App.db.getCharacter(id).then(function (c) {
      if (!c || !c.pixelImage) {
        window.App.showError(window.App.t('error.exportFailed'), window.App.t('error.noPixelFound'));
        return;
      }
      window.App.analytics.track('character_export');
      var link = document.createElement('a');
      link.download = 'character-' + (c.name || 'pixel') + '.png';
      link.href = c.pixelImage;
      link.click();
    });
  }

  // ==================== 工具函数 ====================

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 场景库渲染 ====================

  var sceneGrid = document.getElementById('scene-grid');

  function loadScenes() {
    var scenes = window.App.scene.getAll();
    if (scenes.length === 0) {
      sceneGrid.innerHTML = '<p class="col-span-full text-center text-secondary py-12">' + window.App.t('resource.noScenes') + '</p>';
      return;
    }

    var templateNames = {
      'grid': window.App.t('template.grid'),
      'living-room': window.App.t('template.living-room'),
      'grassland': window.App.t('template.grassland'),
      'beach': window.App.t('template.beach')
    };

    var html = '';
    scenes.sort(function (a, b) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    scenes.forEach(function (s) {
      var tplName = templateNames[s.template] || s.template;
      var date = new Date(s.updatedAt).toLocaleDateString(window.App.getLocale());
      html += ''
        + '<div class="bg-bgLight rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">'
        + '  <div class="h-28 bg-white flex items-center justify-center border-b border-border">'
        + '    <span class="text-3xl">🎬</span>'
        + '  </div>'
        + '  <div class="p-3">'
        + '    <h4 class="font-medium text-sm truncate" title="' + escapeHtml(s.name) + '">' + escapeHtml(s.name) + '</h4>'
        + '    <p class="text-xs text-secondary mt-1">' + tplName + ' · ' + window.App.t('resource.charsCount', (s.characterCount || 0)) + '</p>'
        + '    <p class="text-xs text-disabled mt-0.5">' + date + '</p>'
        + '    <div class="flex space-x-1 mt-2">'
        + '      <button class="flex-1 px-2 py-1 bg-white border border-border rounded text-xs hover:bg-bgLight transition-colors scene-edit-btn" data-id="' + s.id + '">' + window.App.t('resource.edit') + '</button>'
        + '      <button class="flex-1 px-2 py-1 bg-white border border-border rounded text-xs hover:bg-bgLight transition-colors scene-rename-btn" data-id="' + s.id + '">' + window.App.t('resource.rename') + '</button>'
        + '      <button class="px-2 py-1 bg-white text-error border border-error rounded text-xs hover:bg-error hover:text-white transition-colors scene-delete-btn" data-id="' + s.id + '">' + window.App.t('resource.delete') + '</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';
    });

    sceneGrid.innerHTML = html;

    // 绑定编辑按钮
    sceneGrid.querySelectorAll('.scene-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.App.scene.loadById(this.getAttribute('data-id'));
      });
    });

    // 绑定重命名按钮
    sceneGrid.querySelectorAll('.scene-rename-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var scenes = window.App.scene.getAll();
        var found = null;
        for (var i = 0; i < scenes.length; i++) {
          if (scenes[i].id === id) { found = scenes[i]; break; }
        }
        if (!found) return;
        var newName = prompt(window.App.t('prompt.rename'), found.name);
        if (!newName || !newName.trim()) return;
        window.App.scene.rename(id, newName.trim());
        window.App.showSuccess(window.App.t('success.sceneRenamed'));
        loadScenes();
      });
    });

    // 绑定删除按钮
    sceneGrid.querySelectorAll('.scene-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var scenes = window.App.scene.getAll();
        var found = null;
        for (var i = 0; i < scenes.length; i++) {
          if (scenes[i].id === id) { found = scenes[i]; break; }
        }
        if (!found) return;
        if (!confirm(window.App.t('delete.sceneConfirm', found.name))) return;
        window.App.scene.delete(id);
        window.App.showSuccess(window.App.t('success.sceneDeleted'));
        loadScenes();
      });
    });
  }

  // ==================== 暴露API ====================

  // ==================== ESC 关闭编辑/删除弹窗 ====================

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!editModal.classList.contains('hidden')) closeEditModal();
      if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
    }
  });

  // ==================== 暴露API ====================

  window.App.loadCharacters = loadCharacters;
  window.App.loadScenes = loadScenes;
  window.App.switchTab = switchTab;

})();
