# 代码规范

## 1. 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| HTML文件 | 小写 + 连字符 | `index.html` |
| CSS文件 | 小写 + 连字符 | `styles.css` |
| JS文件 | 小写 + 连字符 | `canvas-editor.js` |
| 图片资源 | 小写 + 连字符 | `living-room.png` |
| 文件夹 | 小写 + 连字符 | `dev-logs` |

## 2. HTML规范

- 使用 HTML5 文档声明 `<!DOCTYPE html>`
- 字符编码 UTF-8
- 语义化标签优先（`<header>`, `<main>`, `<section>`, `<nav>` 等）
- 缩进：2空格
- 属性使用双引号
- `id` 使用连字符命名（如 `upload-area`），`class` 优先使用 Tailwind 工具类
- 图片必须有 `alt` 属性

## 3. CSS规范

- 优先使用 Tailwind CSS 工具类
- 自定义样式写在 `css/styles.css` 中
- 类名使用 Tailwind 的 `@layer utilities` 或 `@layer components` 包裹
- 避免使用 `!important`
- 颜色统一使用设计文档5.1节定义的CSS变量或Tailwind配置

## 4. JavaScript规范

### 4.1 基本规则
- 使用 ES6+ 语法（`const`/`let`、箭头函数、模板字符串、解构等）
- 缩进：2空格
- 分号：必须
- 字符串：优先使用模板字符串，其次单引号
- 命名：
  - 变量/函数：驼峰命名 `camelCase`
  - 常量：大写+下划线 `MAX_FILE_SIZE`
  - 类/构造函数：帕斯卡命名 `PascalCase`
  - DOM元素ID引用变量：保持与HTML id一致或使用驼峰

### 4.2 函数设计
- 单一职责：每个函数只做一件事
- 函数不超过50行（特殊情况除外）
- 复杂逻辑必须有注释说明意图
- 异步操作统一使用 `async/await`

### 4.3 DOM操作
- 缓存DOM查询结果（不要反复 `getElementById`）
- 批量DOM更新使用 `DocumentFragment` 或先拼接再一次性插入
- 事件监听使用 `addEventListener`，不使用 `onclick` HTML属性

### 4.4 模块组织
- 每个JS文件对应一个功能域
- 禁止在JS中直接写内联样式，使用CSS类切换
- 全局变量统一挂在 `window.App` 命名空间下

## 5. 数据规范

- 时间统一使用 ISO 8601 格式 (`new Date().toISOString()`)
- ID使用 UUID（可用 `crypto.randomUUID()`）
- Base64图片数据统一带 `data:image/png;base64,` 前缀

## 6. 错误处理

- 所有异步操作必须 `try/catch`
- IndexedDB操作失败时提供降级方案
- 用户可见的错误信息使用中文，简洁清晰
- 控制台错误使用 `console.error`，带模块前缀
