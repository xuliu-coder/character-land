// i18n.js — 多语言国际化模块
// Character Land Internationalization

(function () {
  'use strict';

  window.App = window.App || {};

  var SUPPORTED_LANGS = [
    { code: 'zh', name: 'Chinese',  nativeName: '简体中文', locale: 'zh-CN' },
    { code: 'en', name: 'English',  nativeName: 'English',  locale: 'en-US' },
    { code: 'ru', name: 'Russian',  nativeName: 'Русский',  locale: 'ru-RU' },
    { code: 'es', name: 'Spanish',  nativeName: 'Español',  locale: 'es-ES' },
    { code: 'fr', name: 'French',   nativeName: 'Français', locale: 'fr-FR' }
  ];

  var DICT = {
    // ---- 顶部导航 ----
    'nav.title':            { zh: '我的角色世界',        en: 'Character Land',         ru: 'Character Land',           es: 'Character Land',           fr: 'Character Land' },
    'tab.character':        { zh: '角色生成',            en: 'Characters',             ru: 'Персонажи',                es: 'Personajes',               fr: 'Personnages' },
    'tab.scene':            { zh: '场景编辑',            en: 'Scene Editor',           ru: 'Редактор сцен',            es: 'Editor de escena',         fr: 'Éditeur de scène' },
    'tab.resource':         { zh: '资源管理',            en: 'Resources',              ru: 'Ресурсы',                  es: 'Recursos',                 fr: 'Ressources' },

    // ---- 页面元数据 ----
    'meta.title':           { zh: '我的角色世界 — Character Land', en: 'Character Land — My Character World', ru: 'Character Land — Мой мир персонажей', es: 'Character Land — Mi mundo de personajes', fr: 'Character Land — Mon monde de personnages' },
    'meta.description':     { zh: '上传喜欢的角色图片，生成像素风Q版小人，在场景中自由摆放', en: 'Upload character images, generate pixel chibi art, and arrange them freely in scenes', ru: 'Загружайте изображения персонажей, создавайте пиксельные чиби и расставляйте их в сценах', es: 'Sube imágenes de personajes, genera arte píxel chibi y colócalos libremente en escenas', fr: 'Téléchargez des images de personnages, générez des pixel arts chibi et organisez-les dans des scènes' },

    // ---- 移动端横幅 ----
    'mobile.banner':        { zh: '为获得完整体验，建议使用桌面端浏览器访问。当前移动端仅提供基础浏览功能。', en: 'For the full experience, please use a desktop browser. Mobile currently offers basic browsing only.', ru: 'Для полного функционала используйте настольный браузер. Мобильная версия предлагает только базовый просмотр.', es: 'Para una experiencia completa, usa un navegador de escritorio. La versión móvil solo ofrece funciones básicas.', fr: 'Pour une expérience complète, utilisez un navigateur de bureau. La version mobile offre uniquement la navigation de base.' },
    'mobile.dismiss':       { zh: '知道了',              en: 'Got it',                 ru: 'Понятно',                  es: 'Entendido',                fr: 'Compris' },

    // ---- 上传区域 ----
    'upload.label':         { zh: '上传角色图片 *',       en: 'Upload Image *',          ru: 'Загрузить фото *',         es: 'Subir imagen *',           fr: 'Télécharger image *' },
    'upload.dropHint':      { zh: '拖拽或点击选择文件',    en: 'Drag & drop or click to select', ru: 'Перетащите или нажмите для выбора', es: 'Arrastra o haz clic para seleccionar', fr: 'Glissez-déposez ou cliquez pour sélectionner' },
    'upload.formatHint':    { zh: '支持 JPG / PNG 格式，最大 5MB', en: 'Supports JPG / PNG, max 5MB', ru: 'Поддерживает JPG / PNG, макс. 5 МБ', es: 'Soporta JPG / PNG, máx. 5 MB', fr: 'Supporte JPG / PNG, max 5 Mo' },
    'upload.selected':      { zh: '已选择：',              en: 'Selected: ',              ru: 'Выбрано: ',                 es: 'Seleccionado: ',            fr: 'Sélectionné : ' },
    'upload.previewAlt':    { zh: '上传图片预览',          en: 'Upload preview',          ru: 'Предпросмотр',             es: 'Vista previa',             fr: 'Aperçu' },

    // ---- 表单 ----
    'form.name':            { zh: '角色名称 *',           en: 'Character Name *',       ru: 'Имя персонажа *',          es: 'Nombre del personaje *',   fr: 'Nom du personnage *' },
    'form.namePlaceholder': { zh: '输入角色名称，如：孙悟空、Iron Man、木之本樱', en: 'Enter character name, e.g. Sun Wukong, Iron Man, Sakura', ru: 'Введите имя, напр. Сунь Укун, Iron Man, Сакура', es: 'Ingresa el nombre, ej. Sun Wukong, Iron Man, Sakura', fr: 'Entrez le nom, ex. Sun Wukong, Iron Man, Sakura' },
    'form.source':          { zh: '角色出处',              en: 'Source',                  ru: 'Источник',                  es: 'Origen',                    fr: 'Source' },
    'form.sourcePlaceholder': { zh: '如：《西游记》、《复仇者联盟》、《百变小樱》', en: 'e.g. Journey to the West, Avengers, Cardcaptor Sakura', ru: 'напр. Путешествие на Запад, Мстители, Сакура', es: 'ej. Viaje al Oeste, Avengers, Sakura Card Captor', fr: 'ex. Le Voyage en Occident, Avengers, Sakura' },
    'form.description':     { zh: '角色描述',              en: 'Description',             ru: 'Описание',                  es: 'Descripción',              fr: 'Description' },
    'form.descPlaceholder': { zh: '简单描述角色特点',       en: 'Briefly describe the character', ru: 'Кратко опишите персонажа', es: 'Describe brevemente al personaje', fr: 'Décrivez brièvement le personnage' },
    'form.quote':           { zh: '经典台词',              en: 'Classic Quote',           ru: 'Цитата',                    es: 'Cita clásica',             fr: 'Citation' },
    'form.quotePlaceholder': { zh: '角色的经典台词',        en: 'A classic quote from the character', ru: 'Известная цитата персонажа', es: 'Una cita clásica del personaje', fr: 'Une citation classique du personnage' },

    // ---- 生成按钮与状态 ----
    'generate.btn':         { zh: '生成像素形象',          en: 'Generate Pixel Art',     ru: 'Создать пиксель-арт',      es: 'Generar pixel art',        fr: 'Générer pixel art' },
    'generate.processing':  { zh: '处理中...',             en: 'Processing...',           ru: 'Обработка...',              es: 'Procesando...',             fr: 'Traitement...' },
    'generate.recognizing': { zh: '正在识别角色主体...',    en: 'Recognizing subject...',  ru: 'Распознавание объекта...',  es: 'Reconociendo sujeto...',    fr: 'Reconnaissance du sujet...' },
    'generate.pixelating':  { zh: '像素化中...',           en: 'Pixelating...',           ru: 'Пикселизация...',           es: 'Pixelando...',              fr: 'Pixélisation...' },
    'generate.inProgress':  { zh: '正在生成像素形象...',    en: 'Generating pixel art...', ru: 'Создание пиксель-арта...',  es: 'Generando pixel art...',    fr: 'Génération du pixel art...' },
    'generate.extractConfirm': { zh: '确认角色提取，生成像素形象', en: 'Confirm extraction & generate', ru: 'Подтвердить и создать', es: 'Confirmar extracción y generar', fr: 'Confirmer extraction et générer' },

    // ---- 预览区域 ----
    'preview.title':        { zh: '像素形象预览',          en: 'Pixel Art Preview',      ru: 'Предпросмотр',             es: 'Vista previa del pixel art', fr: 'Aperçu pixel art' },
    'preview.placeholder':  { zh: '上传图片后生成像素小人预览', en: 'Upload an image to generate pixel art preview', ru: 'Загрузите изображение для предпросмотра', es: 'Sube una imagen para generar vista previa', fr: 'Téléchargez une image pour générer un aperçu' },
    'preview.extracted':    { zh: '角色已识别',              en: 'Character Identified',   ru: 'Персонаж распознан',        es: 'Personaje identificado',    fr: 'Personnage identifié' },
    'preview.extractFail':  { zh: '自动识别未成功',          en: 'Auto-detection failed',  ru: 'Автоопределение не удалось', es: 'Detección automática fallida', fr: 'Détection automatique échouée' },
    'preview.extractFailHint': { zh: '请尝试手动框选角色区域，或重新上传图片', en: 'Try manually cropping the character area, or re-upload', ru: 'Попробуйте обрезать вручную или загрузить снова', es: 'Intenta recortar manualmente o volver a subir', fr: 'Essayez de recadrer manuellement ou de re-télécharger' },

    // ---- 预览操作按钮 ----
    'preview.manualCrop':   { zh: '手动调整选区',          en: 'Manual Crop',            ru: 'Ручная обрезка',           es: 'Recorte manual',           fr: 'Recadrage manuel' },
    'preview.reupload':     { zh: '重新上传图片',          en: 'Re-upload Image',        ru: 'Загрузить заново',         es: 'Volver a subir',           fr: 'Re-télécharger' },

    // ---- 参数控制 ----
    'params.title':         { zh: '对称增强 + 特征保护 + 色板量化 + 色块优化 + 智能轮廓', en: 'Symmetry + Feature Protection + Palette + Block Optimize + Smart Outline', ru: 'Симметрия + Защита + Палитра + Оптимизация + Контур', es: 'Simetría + Protección + Paleta + Bloques + Contorno', fr: 'Symétrie + Protection + Palette + Blocs + Contour' },
    'params.pixelSize':     { zh: '像素块大小',              en: 'Pixel Size',              ru: 'Размер пикселя',           es: 'Tamaño de píxel',          fr: 'Taille de pixel' },
    'params.colorCount':    { zh: '颜色数量',                en: 'Color Count',             ru: 'Количество цветов',        es: 'Número de colores',        fr: 'Nombre de couleurs' },
    'params.symmetry':      { zh: '对称增强',                en: 'Symmetry Enhance',        ru: 'Усиление симметрии',       es: 'Mejora de simetría',       fr: 'Amélioration symétrie' },
    'params.outline':       { zh: '轮廓增强',                en: 'Outline Enhance',         ru: 'Усиление контура',         es: 'Mejora de contorno',       fr: 'Amélioration contour' },

    // ---- 保存 ----
    'save.confirmBtn':      { zh: '确认保存到角色库',        en: 'Save to Library',         ru: 'Сохранить в библиотеку',   es: 'Guardar en biblioteca',    fr: 'Enregistrer dans la bibliothèque' },
    'save.regenerateBtn':   { zh: '重新生成',                en: 'Regenerate',              ru: 'Создать заново',           es: 'Regenerar',                fr: 'Régénérer' },
    'save.exportSingleBtn': { zh: '导出单角色图片',          en: 'Export Character Image',  ru: 'Экспорт персонажа',        es: 'Exportar imagen del personaje', fr: 'Exporter image du personnage' },

    // ---- 场景编辑器 ----
    'scene.newScene':       { zh: '新建场景',                en: 'New Scene',               ru: 'Новая сцена',              es: 'Nueva escena',             fr: 'Nouvelle scène' },
    'scene.saveScene':      { zh: '保存场景',                en: 'Save Scene',              ru: 'Сохранить сцену',          es: 'Guardar escena',           fr: 'Enregistrer la scène' },
    'scene.undo':           { zh: '撤销',                    en: 'Undo',                    ru: 'Отменить',                  es: 'Deshacer',                  fr: 'Annuler' },
    'scene.undoTitle':      { zh: '撤销 (Ctrl+Z)',           en: 'Undo (Ctrl+Z)',           ru: 'Отменить (Ctrl+Z)',        es: 'Deshacer (Ctrl+Z)',        fr: 'Annuler (Ctrl+Z)' },
    'scene.redo':           { zh: '重做',                    en: 'Redo',                    ru: 'Повторить',                 es: 'Rehacer',                   fr: 'Rétablir' },
    'scene.redoTitle':      { zh: '重做 (Ctrl+Y)',           en: 'Redo (Ctrl+Y)',           ru: 'Повторить (Ctrl+Y)',       es: 'Rehacer (Ctrl+Y)',         fr: 'Rétablir (Ctrl+Y)' },
    'scene.exportScene':    { zh: '导出场景图片',            en: 'Export Scene Image',      ru: 'Экспорт сцены',            es: 'Exportar imagen de escena', fr: 'Exporter image de la scène' },
    'scene.charLibrary':    { zh: '角色库',                  en: 'Character Library',       ru: 'Библиотека персонажей',    es: 'Biblioteca de personajes', fr: 'Bibliothèque de personnages' },
    'scene.loading':        { zh: '加载中...',               en: 'Loading...',              ru: 'Загрузка...',              es: 'Cargando...',              fr: 'Chargement...' },
    'scene.templates':      { zh: '场景模板',                en: 'Scene Templates',         ru: 'Шаблоны сцен',             es: 'Plantillas de escena',     fr: 'Modèles de scène' },
    'scene.canvasHint':     { zh: '从左侧拖拽角色到画布上',    en: 'Drag characters from the left onto the canvas', ru: 'Перетащите персонажей на холст', es: 'Arrastra personajes al lienzo', fr: 'Faites glisser les personnages sur le canevas' },
    'scene.propsPanel':     { zh: '元素属性',                en: 'Properties',              ru: 'Свойства',                  es: 'Propiedades',              fr: 'Propriétés' },
    'scene.propsEmpty':     { zh: '点击画布上的角色查看属性',  en: 'Click a character on the canvas to view properties', ru: 'Нажмите на персонажа для просмотра свойств', es: 'Haz clic en un personaje para ver propiedades', fr: 'Cliquez sur un personnage pour voir les propriétés' },
    'scene.deleteSelected': { zh: '删除选中角色',            en: 'Delete Selected',         ru: 'Удалить выбранное',        es: 'Eliminar seleccionado',    fr: 'Supprimer sélectionné' },
    'scene.emptyCharList':  { zh: '暂无角色',                en: 'No characters',           ru: 'Нет персонажей',           es: 'Sin personajes',           fr: 'Aucun personnage' },
    'scene.exporting':      { zh: '导出中...',               en: 'Exporting...',            ru: 'Экспорт...',               es: 'Exportando...',            fr: 'Exportation...' },

    // ---- 资源管理 ----
    'resource.characters':  { zh: '角色库',                  en: 'Characters',              ru: 'Персонажи',                 es: 'Personajes',               fr: 'Personnages' },
    'resource.scenes':      { zh: '场景库',                  en: 'Scenes',                  ru: 'Сцены',                     es: 'Escenas',                  fr: 'Scènes' },
    'resource.searchPlaceholder': { zh: '搜索角色名称...',    en: 'Search character name...', ru: 'Поиск по имени...',        es: 'Buscar nombre...',         fr: 'Rechercher nom...' },
    'resource.allSources':  { zh: '全部出处',                en: 'All Sources',             ru: 'Все источники',            es: 'Todos los orígenes',       fr: 'Toutes les sources' },
    'resource.characterCount': { zh: '共 %s 个角色',          en: '%s character(s)',         ru: 'Персонажей: %s',           es: '%s personaje(s)',          fr: '%s personnage(s)' },
    'resource.noCharacters': { zh: '暂无角色，请先在"角色生成"页创建', en: 'No characters yet. Create one in the Characters tab.', ru: 'Нет персонажей. Создайте во вкладке Персонажи.', es: 'Sin personajes. Crea uno en la pestaña Personajes.', fr: 'Aucun personnage. Créez-en un dans l\'onglet Personnages.' },
    'resource.noScenes':    { zh: '暂无场景，请先在"场景编辑"页创建', en: 'No scenes yet. Create one in the Scene Editor tab.', ru: 'Нет сцен. Создайте во вкладке Редактор сцен.', es: 'Sin escenas. Crea una en la pestaña Editor de escena.', fr: 'Aucune scène. Créez-en une dans l\'onglet Éditeur de scène.' },
    'resource.loadError':   { zh: '加载角色失败，请刷新页面重试', en: 'Failed to load characters. Please refresh the page.', ru: 'Не удалось загрузить персонажей. Обновите страницу.', es: 'Error al cargar personajes. Actualiza la página.', fr: 'Échec du chargement des personnages. Actualisez la page.' },
    'resource.source':      { zh: '出处：',                  en: 'Source: ',                ru: 'Источник: ',                es: 'Origen: ',                  fr: 'Source : ' },
    'resource.noSource':    { zh: '未设出处',                en: 'No source',               ru: 'Без источника',            es: 'Sin origen',               fr: 'Sans source' },
    'resource.edit':        { zh: '编辑',                    en: 'Edit',                    ru: 'Ред.',                      es: 'Editar',                    fr: 'Modifier' },
    'resource.export':      { zh: '导出',                    en: 'Export',                  ru: 'Экспорт',                   es: 'Exportar',                  fr: 'Exporter' },
    'resource.delete':      { zh: '删',                      en: 'Del',                     ru: 'Уд.',                       es: 'Elim',                      fr: 'Suppr' },
    'resource.rename':      { zh: '重命名',                  en: 'Rename',                  ru: 'Переим.',                   es: 'Renombrar',                 fr: 'Renommer' },
    'resource.charsCount':  { zh: '%s 个角色',               en: '%s character(s)',          ru: '%s персонаж(ей)',           es: '%s personaje(s)',           fr: '%s personnage(s)' },

    // ---- 弹窗通用 ----
    'modal.retry':          { zh: '重试',                    en: 'Retry',                   ru: 'Повторить',                 es: 'Reintentar',                fr: 'Réessayer' },
    'modal.close':          { zh: '关闭',                    en: 'Close',                   ru: 'Закрыть',                   es: 'Cerrar',                    fr: 'Fermer' },
    'modal.ok':             { zh: '确定',                    en: 'OK',                      ru: 'OK',                        es: 'Aceptar',                   fr: 'OK' },
    'modal.cancel':         { zh: '取消',                    en: 'Cancel',                  ru: 'Отмена',                    es: 'Cancelar',                  fr: 'Annuler' },

    // ---- 编辑弹窗 ----
    'edit.title':           { zh: '编辑角色信息',            en: 'Edit Character Info',     ru: 'Редактировать персонажа',  es: 'Editar información',       fr: 'Modifier les infos' },
    'edit.saveBtn':         { zh: '保存修改',                en: 'Save Changes',            ru: 'Сохранить',                 es: 'Guardar cambios',           fr: 'Enregistrer' },

    // ---- 删除弹窗 ----
    'delete.title':         { zh: '确认删除',                en: 'Confirm Delete',          ru: 'Подтвердить удаление',     es: 'Confirmar eliminación',    fr: 'Confirmer la suppression' },
    'delete.confirmBtn':    { zh: '确认删除',                en: 'Confirm Delete',          ru: 'Подтвердить',              es: 'Confirmar',                fr: 'Confirmer' },
    'delete.charConfirm':   { zh: '确定要删除角色 "%s" 吗？此操作不可撤销。', en: 'Are you sure you want to delete "%s"? This cannot be undone.', ru: 'Вы уверены, что хотите удалить "%s"? Это действие необратимо.', es: '¿Estás seguro de eliminar "%s"? Esta acción no se puede deshacer.', fr: 'Êtes-vous sûr de vouloir supprimer "%s" ? Cette action est irréversible.' },
    'delete.sceneConfirm':  { zh: '确定要删除场景「%s」吗？此操作不可撤销。', en: 'Are you sure you want to delete scene "%s"? This cannot be undone.', ru: 'Вы уверены, что хотите удалить сцену "%s"? Это действие необратимо.', es: '¿Estás seguro de eliminar la escena "%s"? No se puede deshacer.', fr: 'Êtes-vous sûr de vouloir supprimer la scène "%s" ? Cette action est irréversible.' },

    // ---- 裁剪弹窗 ----
    'crop.title':           { zh: '手动框选角色区域',        en: 'Manually Select Character Area', ru: 'Выделите область персонажа', es: 'Selecciona el área del personaje', fr: 'Sélectionnez la zone du personnage' },
    'crop.instruction':     { zh: '在图片上拖拽框选角色主体',  en: 'Drag on the image to select the character subject', ru: 'Обведите персонажа на изображении', es: 'Arrastra sobre la imagen para seleccionar', fr: 'Faites glisser sur l\'image pour sélectionner' },
    'crop.confirm':         { zh: '确认裁剪',                en: 'Confirm Crop',            ru: 'Подтвердить обрезку',      es: 'Confirmar recorte',        fr: 'Confirmer le recadrage' },

    // ---- 错误提示 ----
    'error.generic':        { zh: '操作失败',                en: 'Operation Failed',        ru: 'Ошибка операции',          es: 'Operación fallida',        fr: 'Échec de l\'opération' },
    'error.unknown':        { zh: '发生未知错误，请重试',      en: 'An unknown error occurred. Please try again.', ru: 'Произошла неизвестная ошибка. Попробуйте снова.', es: 'Ocurrió un error desconocido. Inténtalo de nuevo.', fr: 'Une erreur inconnue est survenue. Veuillez réessayer.' },
    'error.fileFormat':     { zh: '不支持的文件格式，请上传 JPG 或 PNG 格式的图片', en: 'Unsupported file format. Please upload JPG or PNG images.', ru: 'Неподдерживаемый формат. Загрузите JPG или PNG.', es: 'Formato no soportado. Sube imágenes JPG o PNG.', fr: 'Format non supporté. Téléchargez des images JPG ou PNG.' },
    'error.fileSize':       { zh: '图片大小超过 5MB 限制，请压缩后重新上传', en: 'Image exceeds 5MB limit. Please compress and re-upload.', ru: 'Файл превышает 5 МБ. Сожмите и загрузите снова.', es: 'La imagen supera el límite de 5 MB. Comprime y vuelve a subir.', fr: 'L\'image dépasse la limite de 5 Mo. Compressez et re-téléchargez.' },
    'error.noFile':         { zh: '请先上传角色图片',          en: 'Please upload an image first.', ru: 'Сначала загрузите изображение.', es: 'Primero sube una imagen.', fr: 'Veuillez d\'abord télécharger une image.' },
    'error.noName':         { zh: '请输入角色名称',            en: 'Please enter a character name.', ru: 'Введите имя персонажа.',  es: 'Ingresa un nombre de personaje.', fr: 'Veuillez entrer un nom de personnage.' },
    'error.noExtraction':   { zh: '请先完成角色提取',          en: 'Please complete character extraction first.', ru: 'Сначала завершите извлечение персонажа.', es: 'Primero completa la extracción del personaje.', fr: 'Veuillez d\'abord terminer l\'extraction.' },
    'error.pixelateError':  { zh: '像素化处理出错，请重试',      en: 'Pixelation error. Please try again.', ru: 'Ошибка пикселизации. Попробуйте снова.', es: 'Error de pixelado. Inténtalo de nuevo.', fr: 'Erreur de pixélisation. Veuillez réessayer.' },
    'error.noPixelResult':  { zh: '没有可保存的像素形象',      en: 'No pixel art to save.',  ru: 'Нет пиксель-арта для сохранения.', es: 'No hay pixel art para guardar.', fr: 'Aucun pixel art à enregistrer.' },
    'error.nameRequired':   { zh: '角色名称不能为空',          en: 'Character name cannot be empty.', ru: 'Имя персонажа не может быть пустым.', es: 'El nombre no puede estar vacío.', fr: 'Le nom ne peut pas être vide.' },
    'error.storageError':   { zh: '数据存储出错，请重试',      en: 'Storage error. Please try again.', ru: 'Ошибка хранения. Попробуйте снова.', es: 'Error de almacenamiento. Inténtalo de nuevo.', fr: 'Erreur de stockage. Veuillez réessayer.' },
    'error.noPixelExport':  { zh: '没有可导出的像素形象',      en: 'No pixel art to export.', ru: 'Нет пиксель-арта для экспорта.', es: 'No hay pixel art para exportar.', fr: 'Aucun pixel art à exporter.' },
    'error.cropFailed':     { zh: '裁剪失败',                en: 'Crop failed',             ru: 'Ошибка обрезки',           es: 'Error de recorte',         fr: 'Échec du recadrage' },
    'error.cropTooSmall':   { zh: '请拖拽框选更大的区域',      en: 'Please select a larger area.', ru: 'Выделите большую область.', es: 'Selecciona un área más grande.', fr: 'Sélectionnez une zone plus grande.' },
    'error.uploadFailed':   { zh: '上传失败',                en: 'Upload Failed',           ru: 'Ошибка загрузки',          es: 'Error de carga',           fr: 'Échec du téléchargement' },
    'error.generateFailed': { zh: '生成失败',                en: 'Generation Failed',       ru: 'Ошибка создания',          es: 'Error de generación',      fr: 'Échec de la génération' },
    'error.saveFailed':     { zh: '保存失败',                en: 'Save Failed',             ru: 'Ошибка сохранения',        es: 'Error al guardar',         fr: 'Échec de l\'enregistrement' },
    'error.exportFailed':   { zh: '导出失败',                en: 'Export Failed',           ru: 'Ошибка экспорта',          es: 'Error de exportación',     fr: 'Échec de l\'exportation' },
    'error.editFailed':     { zh: '编辑失败',                en: 'Edit Failed',             ru: 'Ошибка редактирования',    es: 'Error de edición',         fr: 'Échec de la modification' },
    'error.loadFailed':     { zh: '加载失败',                en: 'Load Failed',             ru: 'Ошибка загрузки',          es: 'Error de carga',           fr: 'Échec du chargement' },
    'error.deleteFailed':   { zh: '删除失败',                en: 'Delete Failed',           ru: 'Ошибка удаления',          es: 'Error al eliminar',        fr: 'Échec de la suppression' },
    'error.charNotFound':   { zh: '角色不存在',              en: 'Character not found.',    ru: 'Персонаж не найден.',      es: 'Personaje no encontrado.', fr: 'Personnage introuvable.' },
    'error.sceneNotFound':  { zh: '场景不存在',              en: 'Scene not found.',        ru: 'Сцена не найдена.',        es: 'Escena no encontrada.',    fr: 'Scène introuvable.' },
    'error.noPixelFound':   { zh: '未找到角色像素图',          en: 'Character pixel art not found.', ru: 'Пиксель-арт не найден.', es: 'Pixel art no encontrado.', fr: 'Pixel art introuvable.' },
    'error.noSceneChars':   { zh: '场景中没有角色，请先从左侧拖入角色', en: 'No characters in scene. Drag characters from the left panel.', ru: 'Нет персонажей в сцене. Перетащите персонажей.', es: 'No hay personajes en la escena. Arrastra desde el panel.', fr: 'Aucun personnage dans la scène. Faites glisser depuis le panneau.' },
    'error.sceneImgLoad':   { zh: '角色图片加载失败，请重试',    en: 'Character image failed to load. Please try again.', ru: 'Не удалось загрузить изображение. Попробуйте снова.', es: 'Error al cargar imagen. Inténtalo de nuevo.', fr: 'Échec du chargement de l\'image. Réessayez.' },
    'error.modelTimeout':   { zh: '模型加载超时',              en: 'Model loading timed out.', ru: 'Тайм-аут загрузки модели.', es: 'Tiempo de espera agotado.', fr: 'Délai de chargement du modèle expiré.' },
    'error.imgLoadFailed':  { zh: '图片加载失败',              en: 'Image failed to load.',   ru: 'Не удалось загрузить изображение.', es: 'Error al cargar imagen.', fr: 'Échec du chargement de l\'image.' },
    'error.fileReadFailed': { zh: '文件读取失败',              en: 'File read failed.',       ru: 'Ошибка чтения файла.',     es: 'Error al leer archivo.',   fr: 'Échec de lecture du fichier.' },
    'error.blobReadFailed': { zh: 'Blob 读取失败',             en: 'Blob read failed.',       ru: 'Ошибка чтения Blob.',      es: 'Error al leer Blob.',      fr: 'Échec de lecture du Blob.' },
    'error.noSubject':      { zh: '未检测到角色主体',          en: 'No character subject detected.', ru: 'Объект персонажа не обнаружен.', es: 'No se detectó sujeto.', fr: 'Aucun sujet détecté.' },
    'error.complexImage':   { zh: '当前图片较复杂，建议上传单人正面图、纯色背景图，或先手动框选角色主体。', en: 'The image is complex. Try uploading a front-facing character with a solid background, or manually crop the subject.', ru: 'Изображение сложное. Загрузите фото в анфас на однотонном фоне или обрежьте вручную.', es: 'La imagen es compleja. Sube una foto frontal con fondo liso o recorta manualmente.', fr: 'L\'image est complexe. Essayez une photo de face avec fond uni, ou recadrez manuellement.' },
    'error.updateFailed':   { zh: '更新角色信息出错',          en: 'Failed to update character info.', ru: 'Не удалось обновить данные.', es: 'Error al actualizar información.', fr: 'Échec de la mise à jour des informations.' },
    'error.deleteCharFailed': { zh: '删除角色出错',            en: 'Failed to delete character.', ru: 'Не удалось удалить персонажа.', es: 'Error al eliminar personaje.', fr: 'Échec de la suppression du personnage.' },

    // ---- 成功提示 ----
    'success.generic':      { zh: '操作成功',                en: 'Success',                 ru: 'Успешно',                  es: 'Operación exitosa',        fr: 'Opération réussie' },
    'success.charSaved':    { zh: '角色 "%s" 已保存到角色库', en: 'Character "%s" saved to library.', ru: 'Персонаж "%s" сохранён.', es: 'Personaje "%s" guardado.', fr: 'Personnage "%s" enregistré.' },
    'success.charUpdated':  { zh: '角色 "%s" 信息已更新',      en: 'Character "%s" info updated.', ru: 'Данные персонажа "%s" обновлены.', es: 'Información de "%s" actualizada.', fr: 'Informations de "%s" mises à jour.' },
    'success.charDeleted':  { zh: '角色已删除',                en: 'Character deleted.',      ru: 'Персонаж удалён.',         es: 'Personaje eliminado.',     fr: 'Personnage supprimé.' },
    'success.singleExport': { zh: '单角色图片已导出',          en: 'Character image exported.', ru: 'Изображение экспортировано.', es: 'Imagen exportada.',      fr: 'Image exportée.' },
    'success.sceneSaved':   { zh: '场景「%s」已保存',          en: 'Scene "%s" saved.',       ru: 'Сцена "%s" сохранена.',    es: 'Escena "%s" guardada.',    fr: 'Scène "%s" enregistrée.' },
    'success.sceneExported': { zh: '场景图片已导出',           en: 'Scene image exported.',   ru: 'Изображение сцены экспортировано.', es: 'Imagen de escena exportada.', fr: 'Image de la scène exportée.' },
    'success.sceneRenamed': { zh: '场景已重命名',              en: 'Scene renamed.',          ru: 'Сцена переименована.',     es: 'Escena renombrada.',       fr: 'Scène renommée.' },
    'success.sceneDeleted': { zh: '场景已删除',                en: 'Scene deleted.',          ru: 'Сцена удалена.',           es: 'Escena eliminada.',        fr: 'Scène supprimée.' },

    // ---- 属性面板 ----
    'property.name':        { zh: '名称',                    en: 'Name',                    ru: 'Имя',                       es: 'Nombre',                    fr: 'Nom' },
    'property.position':    { zh: '位置',                    en: 'Position',                ru: 'Позиция',                   es: 'Posición',                  fr: 'Position' },
    'property.rotation':    { zh: '旋转',                    en: 'Rotation',                ru: 'Поворот',                   es: 'Rotación',                  fr: 'Rotation' },
    'property.scale':       { zh: '缩放',                    en: 'Scale',                   ru: 'Масштаб',                   es: 'Escala',                    fr: 'Échelle' },
    'property.up':          { zh: '置顶',                    en: 'Bring to Front',          ru: 'На передний план',         es: 'Traer al frente',          fr: 'Premier plan' },
    'property.down':        { zh: '置底',                    en: 'Send to Back',            ru: 'На задний план',           es: 'Enviar al fondo',          fr: 'Arrière-plan' },
    'property.unknown':     { zh: '未知角色',                en: 'Unknown Character',       ru: 'Неизвестный персонаж',     es: 'Personaje desconocido',    fr: 'Personnage inconnu' },

    // ---- 模板名称 ----
    'template.grid':        { zh: '纯色网格',                en: 'Grid',                    ru: 'Сетка',                     es: 'Cuadrícula',               fr: 'Grille' },
    'template.living-room': { zh: '温馨客厅',                en: 'Cozy Living Room',        ru: 'Уютная гостиная',          es: 'Sala acogedora',           fr: 'Salon confortable' },
    'template.grassland':   { zh: '绿色草地',                en: 'Green Grassland',         ru: 'Зелёный луг',              es: 'Pradera verde',            fr: 'Prairie verte' },
    'template.beach':       { zh: '阳光海滩',                en: 'Sunny Beach',             ru: 'Солнечный пляж',           es: 'Playa soleada',            fr: 'Plage ensoleillée' },

    // ---- 确认对话 ----
    'confirm.newScene':     { zh: '创建新场景将清除当前画布上的所有角色，是否继续？', en: 'Creating a new scene will clear all characters on the canvas. Continue?', ru: 'Создание новой сцены удалит всех персонажей с холста. Продолжить?', es: 'Crear una nueva escena borrará todos los personajes. ¿Continuar?', fr: 'Créer une nouvelle scène effacera tous les personnages. Continuer ?' },
    'confirm.sceneOverwrite': { zh: '已存在同名场景「%s」，是否覆盖？', en: 'A scene named "%s" already exists. Overwrite?', ru: 'Сцена с именем "%s" уже существует. Перезаписать?', es: 'Ya existe una escena "%s". ¿Sobrescribir?', fr: 'Une scène nommée "%s" existe déjà. Écraser ?' },

    // ---- 输入提示 ----
    'prompt.sceneName':     { zh: '请输入场景名称：',          en: 'Enter scene name:',       ru: 'Введите имя сцены:',       es: 'Ingresa el nombre de la escena:', fr: 'Entrez le nom de la scène :' },
    'prompt.rename':        { zh: '请输入新名称：',            en: 'Enter new name:',          ru: 'Введите новое имя:',        es: 'Ingresa el nuevo nombre:',  fr: 'Entrez le nouveau nom :' },
    'prompt.defaultSceneName': { zh: '场景 ',                 en: 'Scene ',                  ru: 'Сцена ',                    es: 'Escena ',                   fr: 'Scène ' },

    // ---- 存储 ----
    'storage.title':        { zh: '存储空间提醒',              en: 'Storage Warning',         ru: 'Предупреждение памяти',    es: 'Aviso de almacenamiento',  fr: 'Avertissement stockage' },
    'storage.spaceLow':     { zh: '存储空间不足，请清理旧数据',  en: 'Storage full. Please clear old data.', ru: 'Хранилище заполнено. Очистите старые данные.', es: 'Almacenamiento lleno. Limpia datos antiguos.', fr: 'Stockage plein. Supprimez les anciennes données.' },
    'storage.spaceUsed':    { zh: '存储空间已使用 %s%%，建议清理旧数据以保证正常使用', en: 'Storage %s%% used. Consider clearing old data.', ru: 'Хранилище заполнено на %s%%. Рекомендуется очистить старые данные.', es: 'Almacenamiento al %s%%. Considera limpiar datos antiguos.', fr: 'Stockage à %s%%. Pensez à supprimer les anciennes données.' },

    // ---- 页脚 ----
    'footer.text':          { zh: 'Character Land — 我的角色世界 MVP', en: 'Character Land — My Character World MVP', ru: 'Character Land — Мой мир персонажей MVP', es: 'Character Land — Mi mundo de personajes MVP', fr: 'Character Land — Mon monde de personnages MVP' },

    // ---- 分割/进度 ----
    'seg.loading':          { zh: '正在加载AI模型...',         en: 'Loading AI model...',     ru: 'Загрузка ИИ модели...',    es: 'Cargando modelo IA...',    fr: 'Chargement du modèle IA...' },
    'seg.extracting':       { zh: '正在识别角色主体...',       en: 'Recognizing subject...',  ru: 'Распознавание объекта...',  es: 'Reconociendo sujeto...',    fr: 'Reconnaissance du sujet...' },
    'seg.cpuRetry':         { zh: '正在用CPU重试...',          en: 'Retrying with CPU...',    ru: 'Повтор с CPU...',          es: 'Reintentando con CPU...',  fr: 'Nouvelle tentative avec CPU...' },
    'seg.cropping':         { zh: '正在裁剪角色区域...',       en: 'Cropping character area...', ru: 'Обрезка области...',    es: 'Recortando área...',       fr: 'Recadrage de la zone...' },
  };

  // ==================== 当前语言 ====================

  var currentLang = 'zh';

  function detectBrowserLang() {
    var browserLang = (navigator.language || navigator.userLanguage || '').split('-')[0];
    var found = null;
    for (var i = 0; i < SUPPORTED_LANGS.length; i++) {
      if (SUPPORTED_LANGS[i].code === browserLang) { found = browserLang; break; }
    }
    return found || 'zh';
  }

  // ==================== 公开 API ====================

  function t(key) {
    var entry = DICT[key];
    if (!entry) {
      console.warn('[i18n] Missing translation key:', key);
      return key;
    }
    var text = entry[currentLang] || entry['zh'] || key;

    // 替换占位符 %s
    for (var i = 1; i < arguments.length; i++) {
      text = text.replace('%s', arguments[i]);
    }
    return text;
  }

  function setLanguage(lang) {
    var valid = false;
    for (var i = 0; i < SUPPORTED_LANGS.length; i++) {
      if (SUPPORTED_LANGS[i].code === lang) { valid = true; break; }
    }
    if (!valid) return;

    currentLang = lang;
    try { localStorage.setItem('character-land-lang', lang); } catch (e) {}

    // 更新 html lang 属性
    var locale = getLocale();
    document.documentElement.lang = locale;

    // 更新文档标题
    document.title = t('meta.title');
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('meta.description'));

    // 刷新 DOM 翻译
    applyTranslations();

    // 更新语言切换器按钮文字
    updateLangToggle();

    // 触发自定义事件，通知其他模块刷新 UI
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function getSupportedLanguages() {
    return SUPPORTED_LANGS.slice();
  }

  function getLocale() {
    for (var i = 0; i < SUPPORTED_LANGS.length; i++) {
      if (SUPPORTED_LANGS[i].code === currentLang) {
        return SUPPORTED_LANGS[i].locale;
      }
    }
    return 'zh-CN';
  }

  function applyTranslations() {
    // 翻译 textContent
    var textNodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textNodes.length; i++) {
      var el = textNodes[i];
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    }

    // 翻译 placeholder
    var placeholderNodes = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholderNodes.length; j++) {
      var el2 = placeholderNodes[j];
      var key2 = el2.getAttribute('data-i18n-placeholder');
      if (key2) el2.placeholder = t(key2);
    }

    // 翻译 title 属性
    var titleNodes = document.querySelectorAll('[data-i18n-title]');
    for (var k = 0; k < titleNodes.length; k++) {
      var el3 = titleNodes[k];
      var key3 = el3.getAttribute('data-i18n-title');
      if (key3) el3.title = t(key3);
    }
  }

  // ==================== 语言切换器 UI ====================

  function updateLangToggle() {
    var el = document.getElementById('lang-current');
    if (!el) return;

    // 用当前语言原生名称的前2个字符作为显示
    for (var i = 0; i < SUPPORTED_LANGS.length; i++) {
      if (SUPPORTED_LANGS[i].code === currentLang) {
        el.textContent = SUPPORTED_LANGS[i].code.toUpperCase();
        break;
      }
    }
  }

  function buildLangDropdown() {
    var dropdown = document.getElementById('lang-dropdown');
    if (!dropdown) return;

    var html = '';
    for (var i = 0; i < SUPPORTED_LANGS.length; i++) {
      var lang = SUPPORTED_LANGS[i];
      var isActive = lang.code === currentLang;
      html += '<button class="lang-option w-full text-left px-4 py-2 text-sm hover:bg-bgLight transition-colors flex items-center justify-between" data-lang="' + lang.code + '">'
        + '<span>' + lang.nativeName + '</span>'
        + (isActive ? '<span class="text-primary text-xs">✓</span>' : '')
        + '</button>';
    }
    dropdown.innerHTML = html;

    // 绑定点击事件
    var options = dropdown.querySelectorAll('.lang-option');
    for (var j = 0; j < options.length; j++) {
      options[j].addEventListener('click', function () {
        App.setLanguage(this.getAttribute('data-lang'));
        var dd = document.getElementById('lang-dropdown');
        if (dd) dd.classList.add('hidden');
      });
    }
  }

  function setupLangSwitcher() {
    var toggle = document.getElementById('lang-toggle');
    var dropdown = document.getElementById('lang-dropdown');

    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      // 下拉打开时刷新内容（更新选中标记）
      if (!dropdown.classList.contains('hidden')) {
        buildLangDropdown();
      }
    });

    // 点击页面其他区域关闭
    document.addEventListener('click', function () {
      dropdown.classList.add('hidden');
    });

    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }

  // ==================== 初始化 ====================

  // 从 localStorage 读取语言设置
  var savedLang = null;
  try { savedLang = localStorage.getItem('character-land-lang'); } catch (e) {}
  currentLang = savedLang || detectBrowserLang();

  // 初始化 locale
  var initLocale = getLocale();
  document.documentElement.lang = initLocale;

  // 页面加载完成后应用翻译
  function init() {
    // 设置初始标题
    document.title = t('meta.title');
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('meta.description'));

    applyTranslations();
    buildLangDropdown();
    updateLangToggle();
    setupLangSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== 暴露 API ====================

  window.App.t = t;
  window.App.setLanguage = setLanguage;
  window.App.getLanguage = getLanguage;
  window.App.getSupportedLanguages = getSupportedLanguages;
  window.App.getLocale = getLocale;
  window.App.applyTranslations = applyTranslations;

})();
