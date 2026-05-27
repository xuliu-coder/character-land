# CLAUDE.md — 我的角色世界 (Character Land)

## 项目概述
纯前端 Web 应用，用户上传角色图片 → 生成像素风 Q 版小人 → 在场景中摆放 → 导出 PNG 图片。所有数据存储在浏览器本地（IndexedDB）。

## 核心文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品设计文档 | `design-document.md` | 产品定位、功能规格、技术架构、开发计划 |
| PRD（原始需求） | `Character Land--PRD.pdf` | 用户原始产品需求文档 |
| 原型页面 | `character-land.html` | 用户提供的 UI 原型参考 |

## 开发标准文件

| 标准 | 路径 | 说明 |
|------|------|------|
| 代码规范 | `docs/code-standards.md` | 文件命名、HTML/CSS/JS 编码规范、错误处理约定 |
| 测试用例模板 | `docs/test-case-template.md` | 功能验证测试用例模板 + 各 Phase 核心验证点 |
| 部署指南 | `docs/deployment-guide.md` | 本地运行、GitHub Pages、Vercel 部署方式 |

## 开发日志

| 日志 | 路径 | 说明 |
|------|------|------|
| 任务拆分 | `dev-logs/2026-05-22-task-breakdown.md` | 8个 Phase、32个小任务的完整拆分和依赖关系 |

每日开发日志存放于 `dev-logs/` 目录，命名格式：`YYYY-MM-DD.md`。

---

## 工作约定

### 开发节奏
- 严格按 Phase 1 → 8 顺序推进，每个 Phase 完成后人工验证再进入下一 Phase
- 每个小任务独立完成并验证后再开始下一个
- 不要一口气做太多，保持项目安全稳定

### 任务状态更新
每完成一个任务，在 `dev-logs/2026-05-22-task-breakdown.md` 中将对应状态从 ⬜ 更新为 ✅。遇到阻塞标记 ⏸️ 并记录原因。

### 每日日志
每天结束前在 `dev-logs/` 创建 `YYYY-MM-DD.md`，记录当日完成事项和待办事项。

### 代码规范
所有代码遵循 `docs/code-standards.md` 中的约定。写代码前先阅读该文件。

### 验证
每个任务完成后参照 `docs/test-case-template.md` 进行验证。

### 部署
需要部署时参考 `docs/deployment-guide.md`。
