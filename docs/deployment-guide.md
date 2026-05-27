# 部署指南

## 部署方式

"我的角色世界"是纯前端应用，无需服务器，可选以下方式部署：

---

## 方式一：本地直接打开（开发阶段推荐）

直接双击 `index.html` 在浏览器中打开即可使用。

> 注意：某些浏览器可能因安全策略限制 IndexedDB 在 `file://` 协议下的使用。
> 如遇到此问题，请使用方式二。

---

## 方式二：本地静态服务器（开发阶段推荐）

### 使用 Python
```bash
cd "d:\桌面\character world"
python -m http.server 8080
```
浏览器访问 `http://localhost:8080`

### 使用 Node.js (npx)
```bash
cd "d:\桌面\character world"
npx serve .
```

### 使用 VS Code Live Server
安装 Live Server 插件 → 右键 `index.html` → "Open with Live Server"

---

## 方式三：GitHub Pages（公网部署，免费）

1. 在 GitHub 创建仓库（如 `character-land`）
2. 将项目文件推送到仓库
3. Settings → Pages → Source: `main` branch → Save
4. 等待几分钟后访问 `https://<你的用户名>.github.io/character-land`

---

## 方式四：Vercel（公网部署，免费）

1. 注册 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库或直接拖拽项目文件夹
3. 自动部署，获得 `https://xxx.vercel.app` 域名

---

## 部署前检查清单

- [ ] `index.html` 中所有资源路径使用相对路径
- [ ] 确认 Tailwind CSS CDN链接可访问
- [ ] 所有JS文件无语法错误（浏览器Console无报错）
- [ ] IndexedDB在目标环境下可用
- [ ] 图片资源路径正确
- [ ] 测试导出功能在部署后正常（下载触发不受跨域限制）

---

## 生产环境注意事项（后续版本）

- 考虑将 Tailwind CSS 从 CDN 改为本地构建（减少外部依赖）
- 添加 Service Worker 实现离线访问（PWA）
- 配置 HTTPS（GitHub Pages 和 Vercel 自动提供）
- 添加网站图标（favicon）
