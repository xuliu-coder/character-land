// storage.js — IndexedDB 数据存取（降级 LocalStorage）

(function () {
  'use strict';

  var DB_NAME = 'character-land-db';
  var DB_VERSION = 1;
  var db = null;
  var storageMode = 'indexeddb'; // 'indexeddb' | 'localstorage'

  // ==================== 4.1 IndexedDB 封装 ====================

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (db) {
        resolve(db);
        return;
      }

      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (e) {
        var database = e.target.result;
        if (!database.objectStoreNames.contains('characters')) {
          var charStore = database.createObjectStore('characters', { keyPath: 'id' });
          charStore.createIndex('name', 'name', { unique: false });
          charStore.createIndex('source', 'source', { unique: false });
          charStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!database.objectStoreNames.contains('scenes')) {
          var sceneStore = database.createObjectStore('scenes', { keyPath: 'id' });
          sceneStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = function (e) {
        db = e.target.result;
        storageMode = 'indexeddb';
        resolve(db);
      };

      request.onerror = function () {
        // 降级到 LocalStorage
        storageMode = 'localstorage';
        db = null;
        resolve(null);
      };
    });
  }

  // ==================== 通用 CRUD ====================

  function addItem(storeName, item) {
    if (storageMode === 'localstorage' || !db) {
      return addToLocalStorage(storeName, item);
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var request = store.add(item);
      request.onsuccess = function () { resolve(item); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function getAllItems(storeName) {
    if (storageMode === 'localstorage' || !db) {
      return Promise.resolve(getAllFromLocalStorage(storeName));
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var request = store.getAll();
      request.onsuccess = function () { resolve(request.result || []); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function getItem(storeName, id) {
    if (storageMode === 'localstorage' || !db) {
      var items = getAllFromLocalStorage(storeName);
      return Promise.resolve(items.find(function (item) { return item.id === id; }) || null);
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var request = store.get(id);
      request.onsuccess = function () { resolve(request.result || null); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function updateItem(storeName, item) {
    if (storageMode === 'localstorage' || !db) {
      return updateInLocalStorage(storeName, item);
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var request = store.put(item);
      request.onsuccess = function () { resolve(item); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function deleteItem(storeName, id) {
    if (storageMode === 'localstorage' || !db) {
      return deleteFromLocalStorage(storeName, id);
    }
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var request = store.delete(id);
      request.onsuccess = function () { resolve(); };
      request.onerror = function () { reject(request.error); };
    });
  }

  // ==================== 4.5 LocalStorage 降级 ====================

  function getLSKey(storeName) {
    return DB_NAME + '_' + storeName;
  }

  function getAllFromLocalStorage(storeName) {
    try {
      var raw = localStorage.getItem(getLSKey(storeName));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAllToLocalStorage(storeName, items) {
    try {
      localStorage.setItem(getLSKey(storeName), JSON.stringify(items));
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(new Error('存储空间不足，请清理旧数据'));
    }
  }

  function addToLocalStorage(storeName, item) {
    var items = getAllFromLocalStorage(storeName);
    items.push(item);
    return saveAllToLocalStorage(storeName, items).then(function () { return item; });
  }

  function updateInLocalStorage(storeName, item) {
    var items = getAllFromLocalStorage(storeName);
    var index = items.findIndex(function (i) { return i.id === item.id; });
    if (index !== -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
    return saveAllToLocalStorage(storeName, items).then(function () { return item; });
  }

  function deleteFromLocalStorage(storeName, id) {
    var items = getAllFromLocalStorage(storeName);
    var filtered = items.filter(function (i) { return i.id !== id; });
    return saveAllToLocalStorage(storeName, filtered);
  }

  // ==================== 角色专用 API ====================

  function saveCharacter(characterData) {
    var now = new Date().toISOString();
    var character = {
      id: characterData.id || crypto.randomUUID(),
      name: characterData.name,
      source: characterData.source || '',
      description: characterData.description || '',
      quote: characterData.quote || '',
      originalImage: characterData.originalImage || '',
      pixelImage: characterData.pixelImage || '',
      pixelSize: characterData.pixelSize || 8,
      colorCount: characterData.colorCount || 32,
      outline: characterData.outline !== false,
      createdAt: characterData.createdAt || now,
      updatedAt: now
    };
    return updateItem('characters', character).then(function () { return character; });
  }

  function getAllCharacters() {
    return getAllItems('characters').then(function (items) {
      return items.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });
  }

  function getCharacter(id) {
    return getItem('characters', id);
  }

  function updateCharacter(id, data) {
    return getCharacter(id).then(function (character) {
      if (!character) throw new Error('角色不存在');
      var updated = Object.assign({}, character, data, {
        id: id,
        updatedAt: new Date().toISOString()
      });
      return updateItem('characters', updated);
    });
  }

  function deleteCharacter(id) {
    return deleteItem('characters', id);
  }

  function getStorageMode() {
    return storageMode;
  }

  // ==================== 7.2 存储空间检测 ====================

  function checkStorageSpace() {
    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then(function (estimate) {
        var usage = estimate.usage || 0;
        var quota = estimate.quota || 0;
        if (quota > 0) {
          var pct = Math.round((usage / quota) * 100);
          if (pct > 80) {
            return {
              warning: true,
              message: '存储空间已使用 ' + pct + '%，建议清理旧数据以保证正常使用',
              usage: usage,
              quota: quota,
              percent: pct
            };
          }
          return { warning: false, usage: usage, quota: quota, percent: pct };
        }
        return { warning: false };
      }).catch(function () {
        return { warning: false };
      });
    }
    return Promise.resolve({ warning: false });
  }

  // ==================== 初始化 ====================

  var dbReady = openDB().then(function () {
    if (storageMode === 'localstorage') {
      return { fallback: true };
    }
    return { fallback: false };
  });

  // ==================== 暴露API ====================

  window.App = window.App || {};
  window.App.db = {
    ready: dbReady,
    saveCharacter: saveCharacter,
    getAllCharacters: getAllCharacters,
    getCharacter: getCharacter,
    updateCharacter: updateCharacter,
    deleteCharacter: deleteCharacter,
    getStorageMode: getStorageMode,
    checkStorageSpace: checkStorageSpace
  };

})();
