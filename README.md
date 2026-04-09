# GrowthPilot

GrowthPilot 是一个面向中国大陆大学生的成长驾驶舱产品。它围绕“目标拆解 -> 每日执行 -> 行为记录 -> 周期复盘 -> 数据反馈”这条闭环，帮助用户更稳定地推进自律、学习和求职目标。

## 当前进度

当前仓库已经完成的 MVP 能力包括：

- 中文首页与品牌氛围页
- 目标引导、成长驾驶舱与目标详情页
- 20 分钟专注执行页
- 周复盘页与中文 AI 兜底文案
- PM 数据后台与图表展示基础
- Cloudflare 友好的单仓全栈结构

## 本地开发

```bash
npm run dev
```

打开 `http://127.0.0.1:3000`

## 当前验证方式

已启用：

- 单元测试：`npm run test:unit`
- 组件测试：`npm run test:component`
- 本地构建：`npm run build`

暂缓：

- E2E 自动化（当前阶段改为人工手测）

## 环境变量

复制 `.env.example` 到 `.env.local`，并按需填写：

- `DASHSCOPE_API_KEY`：阿里百炼 API Key（用于轻量个性化计划）
- `DASHSCOPE_MODEL`：默认 `qwen-plus`

## 部署到 Cloudflare

1. 登录 Cloudflare 并安装 Wrangler：`npm install -g wrangler`
2. 创建 D1 数据库：`wrangler d1 create growthpilot-db`
3. 把返回的 `database_id` 填入 [wrangler.jsonc](./wrangler.jsonc)
4. 本地应用迁移：`npm run db:migrate:local`
5. 远程应用迁移：`npm run db:migrate:remote`
6. 构建并本地预览 Worker：`npm run cf:preview`
7. 正式部署：`npm run cf:deploy`

## 计划文档

- 设计文档：`docs/superpowers/specs/2026-04-09-growthpilot-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-09-growthpilot.md`
