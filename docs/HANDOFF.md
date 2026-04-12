# GrowthPilot 项目交接文档

## 1. 项目概述

GrowthPilot 是一个中文优先的成长管理 Web 产品，目标用户是中国大陆大学生。当前产品定位是：

- 帮用户把一个大目标拆成可开始的阶段任务
- 引导用户完成当天最关键的一步
- 记录执行状态、情绪、精力和完成备注
- 在周复盘里生成中文总结与建议
- 在 PM 数据后台里展示行为数据和产品指标

当前版本更接近一个可演示、可继续开发的 MVP，而不是已完全上线的生产版。

## 2. 技术栈与部署形态

### 前端与应用框架

- Next.js 16 App Router
- React 19
- TypeScript
- 全局样式：`src/styles/globals.css`

### 数据与后端

- Next Route Handlers
- Cloudflare D1
- Drizzle ORM
- Zod 校验

### 图表与交互

- Recharts
- motion

### 测试

- Vitest 单元测试
- Vitest 组件测试

### 当前保留的部署思路

- 推荐：`GitHub -> GitHub Actions -> Cloudflare`
- 不再把本机 E2E 或本机 Windows 直连部署作为主路径

## 3. 当前目录结构说明

### 关键目录

- `src/app`：页面与 API Route Handlers
- `src/components`：页面组件
- `src/lib`：业务逻辑、AI、数据库、mock、校验
- `drizzle`：D1 迁移脚本
- `.github/workflows`：自动部署工作流
- `tests/unit`：单元测试
- `tests/component`：组件测试
- `docs/HANDOFF.md`：本交接文档

### 已删除的内容

为了让仓库更适合交付和继续接手，以下内容已清理：

- Playwright 配置与 E2E 测试
- AI 协作专用说明文件：`AGENTS.md`、`CLAUDE.md`
- 旧的 `superpowers` 计划/规格文档
- 本地构建缓存、日志、测试产物不纳入交付仓库

这些内容不是项目运行所必需，继续保留只会增加噪音。

## 4. 核心业务流

### 4.1 建目标

入口：`/onboarding`

当前用户输入字段：

- `title`
- `category`
- `deadline`
- `currentLevel`
- `dailyMinutes`
- `mainBlocker`

后端入口：

- `src/app/api/goals/route.ts`

逻辑：

1. Zod 校验输入
2. 调用 `generatePersonalizedGoalPlan`
3. 如果配置了阿里百炼 Key，则尝试生成轻量个性化计划
4. 如果模型失败，则回退到规则模板
5. 将目标、里程碑、任务和 `profile_snapshot` 写入 D1

### 4.2 今日行动

入口：`/focus`

后端接口：

- `src/app/api/tasks/[taskId]/route.ts`

功能：

- 任务状态更新
- 记录 delay reason
- 记录 mood / energy
- 记录 completion note
- 写入 `task_logs`

### 4.3 周复盘

入口：`/review`

后端接口：

- `src/app/api/reviews/generate/route.ts`

逻辑：

1. 从任务表与任务日志汇总本周信号
2. 计算完成率、拖延原因、最佳时段、主导状态、平均精力
3. 提取最近完成备注 `recentNotes`
4. 生成中文复盘总结与建议
5. 写入 `reviews`

### 4.4 PM 数据后台

入口：`/console`

接口：

- `src/app/api/console/overview/route.ts`

当前展示：

- 北极星指标
- 转化漏斗
- 拖延原因分布
- 周内动作趋势
- 用户分群
- 复盘使用情况
- 会话信号

## 5. AI 能力现状

### 当前已实现

文件：

- `src/lib/ai/goal-planner.ts`
- `src/lib/ai/review-generator.ts`
- `src/lib/ai/rules.ts`

状态：

- 目标计划：已接入阿里百炼兼容接口
- 周复盘：当前仍以规则模板为主
- 模型失败时会自动回退，不影响主流程可用性

### 当前不是完整 AI 产品的地方

- 目标计划仍是“规则骨架 + 轻量改写”，不是深度 Agent
- 复盘不是完整大模型分析，只做了有控制的中文总结
- 没有长期记忆、没有多轮对话、没有复杂推理链

这是刻意控制范围的结果，不是遗漏。

## 6. 数据库现状

### 表结构

主要表：

- `users`
- `goals`
- `milestones`
- `tasks`
- `task_logs`
- `reviews`
- `events`

### 已做迁移

- `drizzle/0000_initial.sql`
- `drizzle/0001_goal_profile_snapshot.sql`

### 重要字段

`goals.profile_snapshot`

用途：

- 保存当前目标创建时的用户上下文
- 当前至少包含：
  - `currentLevel`
  - `dailyMinutes`
  - `mainBlocker`
  - `planSource`
  - `planReason`

## 7. 已完成进度

### 功能完成度

- 首页：完成
- Onboarding：完成
- Dashboard：完成
- Goal Detail：完成
- Focus：完成
- Review：完成
- Console：完成
- Profile：完成
- D1 数据层：完成
- 轻量个性化计划：完成
- GitHub Actions 自动部署配置：完成

### 已验证状态

2026-04-12 最近一次本地验证通过：

- `npm run test:unit`：13 个测试文件、18 个测试全部通过
- `npm run test:component`：6 个测试文件、10 个测试全部通过
- `npm run build`：生产构建通过

当前仓库不再保留 E2E 自动化。

补充说明：

- 在当前 Codex 沙箱内直接运行 `vitest` 或 `next build` 可能出现 `spawn EPERM`
- 该问题已定位为执行环境对子进程创建的限制，不是项目代码错误
- 在正常本地终端或 GitHub Actions 环境中，上述验证命令可以正常执行

## 8. 未完成事项

这些是下一位接手者真正需要继续推进的事项。

### 8.1 GitHub 推送问题

当前本地已经有提交，但执行环境到 GitHub 443 网络不稳定，未完成 push。

现状：

- 本地 commit 已存在
- `git push` 报错是网络层问题，不是 Git 仓库结构问题

建议：

- 在用户本机直接执行 `git push`
- 优先使用 SSH 推送，而不是 HTTPS

### 8.2 GitHub Actions Secrets

仓库已包含：

- `.github/workflows/deploy-cloudflare.yml`

但 GitHub 侧还必须手动补：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

不补这两个，自动部署不会成功。

### 8.3 Cloudflare 自动部署未完成最终验证

当前状态：

- D1 已创建
- `wrangler.jsonc` 中已填入数据库 ID
- 本地和远程 migration 都已跑过
- 但正式线上 Worker 的 GitHub 自动发布还没有完成最终跑通验证

### 8.4 人工验收未完成

需要人工完整走一遍：

- `/onboarding`
- `/dashboard`
- `/goals/[goalId]`
- `/focus`
- `/review`
- `/console`
- `/profile`

重点验收：

- 建目标
- 生成计划来源标识是否正确
- 今日行动状态更新是否成功
- 完成备注是否进入周复盘
- PM 后台数据是否与行为链路一致

## 9. 部署与环境说明

### 9.1 推荐部署路径

主路径：

1. 本地开发
2. `git push origin main`
3. GitHub Actions 自动执行：
   - `npm ci`
   - `npm run test:unit`
   - `npm run test:component`
   - `npm run build`
   - `npm run db:migrate:remote`
   - `npm run cf:deploy`

### 9.2 为什么不推荐当前机器直接部署

原因不是 Cloudflare 配置错误，而是：

- 本机对 GitHub 连通性不稳定
- OpenNext 在 Windows 下兼容性一般

因此更稳妥的做法是交给 GitHub Actions 的 Ubuntu 运行器执行构建和部署。

### 9.3 当前 Cloudflare 配置

文件：

- `wrangler.jsonc`

当前已绑定：

- D1 binding: `DB`
- D1 database name: `growthpilot-db`

当前数据库 ID 已写入仓库配置：

- `bc9c5e28-b1c5-4467-b947-28335939bd69`

接手者应确认这是否就是最终生产环境要使用的数据库。

## 10. 关键代码入口

### 页面入口

- `src/app/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/focus/page.tsx`
- `src/app/review/page.tsx`
- `src/app/console/page.tsx`
- `src/app/profile/page.tsx`

### API 入口

- `src/app/api/goals/route.ts`
- `src/app/api/tasks/[taskId]/route.ts`
- `src/app/api/reviews/generate/route.ts`
- `src/app/api/console/overview/route.ts`

### 核心业务文件

- `src/lib/ai/goal-planner.ts`
- `src/lib/ai/review-generator.ts`
- `src/lib/db/mappers.ts`
- `src/lib/db/queries/goals.ts`
- `src/lib/db/queries/tasks.ts`
- `src/lib/db/queries/reviews.ts`
- `src/lib/db/queries/analytics.ts`

## 11. 接手建议

下一位 AI 或工程师接手时，建议按这个顺序推进：

1. 先把代码推到 GitHub 仓库
2. 在 GitHub 配置 Cloudflare Secrets
3. 先跑通 GitHub Actions 自动部署
4. 拿到线上地址后做人工验收
5. 人工验收通过后，再决定是否继续增强 AI 逻辑或产品表现

不要先继续堆新功能。先把现有版本稳定上线并验证，价值更高。

## 12. 当前结论

这个仓库现在已经处于“可交付、可继续开发”的状态：

- 结构清晰
- 主流程齐全
- 自动化验证可用
- 部署链路已准备
- 剩余问题主要集中在 GitHub 推送和线上最终验收

后续工作不再是重新搭项目，而是完成上线闭环和做针对性增强。
