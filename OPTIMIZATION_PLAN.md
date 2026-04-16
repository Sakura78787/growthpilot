# GrowthPilot MVP 优化执行计划书

> 本文档为执行AI的唯一操作标准，完成后提交验收。每一步必须严格按序执行，不可跳步。

---

## 一、项目现状诊断

### 1.1 已完成
- 本地大模型调用（DashScope）测试通过
- 线上部署网站已搭建（Cloudflare Workers + D1）
- GitHub Actions 自动部署链路已配置

### 1.2 核心问题清单

| 编号 | 问题 | 严重度 | 影响 |
|------|------|--------|------|
| BUG-1 | 大模型生成结果首次正常显示，页面跳转后回退为兜底结果 | 高 | 用户看到"规则模板"而非"大模型个性化"，核心体验断裂 |
| BUG-2 | DashScope API 调用含 `result_format: "message"` 参数，与兼容模式不匹配 | 中 | 可能在某些情况下导致 API 报错或静默回退 |
| BUG-3 | 线上环境缺少 `DASHSCOPE_API_KEY` 和 `DASHSCOPE_MODEL` 环境变量配置 | 高 | 线上大模型调用 100% 回退为规则模板，等于未接入 |
| BUG-4 | Review 页面每次渲染都调 DashScope API（无缓存/去重） | 中 | 无谓 API 消耗；多用户并发时易被限流 |
| REDUNDANT-1 | PM 数据面板 `/console` 及其组件、API、mock 数据、图表——均为内部管理功能，普通用户不需要 | 高 | 增加打包体积、暴露内部数据、干扰极简体验 |
| REDUNDANT-2 | `recharts` 依赖仅被 console 图表使用 | 低 | 多余打包体积 |

---

## 二、优化执行步骤

### Phase 1：修复核心 BUG — 大模型结果跳转后丢失

**根因**：`GoalForm` 创建目标后通过 URL search params（`goalId`、`planSource` 等）传递 LLM 结果标识到 Dashboard。用户通过页面导航（如侧栏链接）返回 Dashboard 时，URL 不带 search params，`DashboardOfflineView` 仅从 `sessionStorage` 读取——而 `sessionStorage` 跨标签页丢失，且 key 依赖 goalId 而随 URL 缺失而缺省为 `"goal-demo-1"`，永远读不到。

**修复策略**：将 `sessionStorage` 改为 `localStorage`，并在新建目标成功时额外持久化「最近一个目标 ID」。Dashboard 和 GoalDetail 的离线视图在缺少 URL 参数时自动从 localStorage 恢复。

#### Step 1.1：改造离线存储层

**文件**：`src/lib/client/offline-goal-plan.ts`

**操作**：
- 将所有 `sessionStorage` 调用替换为 `localStorage`
- 新增常量 `LAST_GOAL_ID_KEY = "growthpilot:lastGoalId"`
- 新增导出函数 `saveLastGoalId(goalId: string)`：调用 `localStorage.setItem(LAST_GOAL_ID_KEY, goalId)`
- 新增导出函数 `readLastGoalId(): string | null`：调用 `localStorage.getItem(LAST_GOAL_ID_KEY)`
- 保持原有 `saveOfflineGoalPlan` 和 `readOfflineGoalPlan` 函数签名不变，仅改 `sessionStorage` → `localStorage`

#### Step 1.2：GoalForm 写入 lastGoalId

**文件**：`src/components/goals/goal-form.tsx`

**操作**：在现有 `saveOfflineGoalPlan(data.goal.id, {...})` 调用之后新增一行：

```typescript
saveLastGoalId(data.goal.id);
```

在文件顶部 import 中新增：

```typescript
import { saveLastGoalId } from "@/lib/client/offline-goal-plan";
```

#### Step 1.3：Dashboard 离线视图修复

**文件**：`src/components/dashboard/dashboard-offline-view.tsx`

**操作**：
- 新增 import：`readLastGoalId` from `@/lib/client/offline-goal-plan`
- 将现有 `useEffect` 改为：

```typescript
useEffect(() => {
  let stored = readOfflineGoalPlan(goalId);
  if (!stored) {
    const lastGoalId = readLastGoalId();
    if (lastGoalId) {
      stored = readOfflineGoalPlan(lastGoalId);
    }
  }
  setStored(stored);
}, [goalId]);
```

#### Step 1.4：GoalDetail 离线视图修复

**文件**：`src/components/goals/goal-detail-offline-view.tsx`

**操作**：
- 新增 import：`readLastGoalId` from `@/lib/client/offline-goal-plan`
- 将现有 `useEffect`（第 20-22 行）改为：

```typescript
useEffect(() => {
  let storedPlan = readOfflineGoalPlan(goalId);
  if (!storedPlan) {
    const lastGoalId = readLastGoalId();
    if (lastGoalId) {
      storedPlan = readOfflineGoalPlan(lastGoalId);
    }
  }
  setStored(storedPlan);
}, [goalId]);
```

---

### Phase 2：打通线上大模型调用

**根因**：Cloudflare Workers 部署后缺少环境变量；DashScope 兼容模式 API 调用含不合规参数。

#### Step 2.1：删除 DashScope API 调用中的无效参数

**文件**：`src/lib/ai/goal-planner.ts`

**操作**：在第 119-128 行的 `body: JSON.stringify({...})` 中，删除 `"result_format": "message"` 这一行。最终 body 结构为：

```typescript
body: JSON.stringify({
  model,
  messages: [
    { role: "system", content: "你只输出合法 JSON 对象一行或多行均可，禁止 markdown 与任何非 JSON 内容。" },
    { role: "user", content: prompt },
  ],
  temperature: 0,
  top_k: 1,
}),
```

> `result_format` 是 DashScope 原生 API 的参数，在 OpenAI 兼容模式 (`/compatible-mode/v1/chat/completions`) 下无效，可能在某些场景引起异常回退。

#### Step 2.2：Cloudflare Worker 环境变量配置

**文件**：`wrangler.jsonc`

**操作**：在 `"d1_databases"` 数组之后新增 `"vars"` 段：

```jsonc
"d1_databases": [
  // ... 现有内容
],
"vars": {
  "DASHSCOPE_MODEL": "tongyi-xiaomi-analysis-flash"
}
```

> `DASHSCOPE_API_KEY` 是敏感信息，**不能写入配置文件**，需通过 Cloudflare Dashboard 或 `wrangler secret put DASHSCOPE_API_KEY` 命令设置。

#### Step 2.3：部署文档补充

**文件**：`README.md`

**操作**：将现有 `## 环境变量` 段替换为：

```markdown
## 环境变量

复制 `.env.example` 到 `.env.local` 后填写：

- `DASHSCOPE_API_KEY`：阿里百炼 API 密钥（必填，缺失则回退为规则模板）
- `DASHSCOPE_MODEL`：模型名称，默认 `tongyi-xiaomi-analysis-flash`

### Cloudflare 线上部署

线上部署除配置 GitHub Secrets 外，还需在 Cloudflare 设置 Worker 环境变量：

1. 在 Cloudflare Dashboard → Workers → growthpilot → Settings → Variables 中设置：
   - `DASHSCOPE_API_KEY`（选择 Encrypt 加密存储）
   - `DASHSCOPE_MODEL`（已在 `wrangler.jsonc` 的 `vars` 中默认配置，可覆盖）
2. 或通过命令行：
   ```bash
   npx wrangler secret put DASHSCOPE_API_KEY
   ```
```

#### Step 2.4：部署工作流增加环境变量提示

**文件**：`.github/workflows/deploy-cloudflare.yml`

**操作**：在 `Deploy worker` 步骤之前新增一个步骤：

```yaml
- name: Verify required secrets
  run: |
    echo "::notice::DASHSCOPE_API_KEY must be set as Cloudflare Worker secret before deployment."
    echo "::notice::Run: npx wrangler secret put DASHSCOPE_API_KEY"
```

---

### Phase 3：移除 PM 数据面板（Console）及相关冗余

#### Step 3.1：删除页面和 API 路由

删除以下文件和目录：

| 目标 | 路径 |
|------|------|
| Console 页面 | `src/app/console/page.tsx` |
| Console 页面目录 | `src/app/console/` 整个目录 |
| Console API 路由 | `src/app/api/console/overview/route.ts` |
| Console API 目录 | `src/app/api/console/` 整个目录 |

#### Step 3.2：删除 Console 专用组件

删除以下文件和目录：

| 目标 | 路径 |
|------|------|
| 组件目录 | `src/components/console/` 整个目录（含 conversion-funnel.tsx, metric-grid.tsx, segment-cards.tsx） |
| 图表目录 | `src/components/charts/` 整个目录（含 action-trend-chart.tsx, delay-reason-chart.tsx） |

#### Step 3.3：删除 Console 专用数据和查询

删除以下文件：

| 目标 | 路径 |
|------|------|
| Console mock 数据 | `src/lib/mock/console-overview.ts` |
| Analytics 查询模块 | `src/lib/db/queries/analytics.ts` |

> 注意：`src/lib/analytics/events.ts` **保留**——它是目标创建、任务更新、复盘生成的事件追踪，被 `goals/route.ts`、`tasks/[taskId]/route.ts`、`reviews/generate/route.ts` 引用，与 Console 无关。

#### Step 3.4：移除对 `/console` 的所有引用

**文件 1**：`src/components/dashboard/insight-panel.tsx`

将：
```tsx
<div className="profile-action-row">
  <Link href="/review" className="secondary-link">
    查看本周复盘
  </Link>
  <Link href="/console" className="secondary-link">
    去看 PM 数据后台
  </Link>
</div>
```

改为：
```tsx
<div className="profile-action-row">
  <Link href="/review" className="secondary-link">
    查看本周复盘
  </Link>
</div>
```

**文件 2**：`src/components/review/review-summary.tsx`

将：
```tsx
<div className="review-action-row">
  <Link href="/dashboard" className="secondary-link">
    回到成长驾驶舱
  </Link>
  <Link href="/console" className="secondary-link">
    查看 PM 数据后台
  </Link>
  <Link href="/profile" className="secondary-link">
    打开成长档案
  </Link>
</div>
```

改为：
```tsx
<div className="review-action-row">
  <Link href="/dashboard" className="secondary-link">
    回到成长驾驶舱
  </Link>
  <Link href="/profile" className="secondary-link">
    打开成长档案
  </Link>
</div>
```

#### Step 3.5：删除 recharts 依赖

**文件**：`package.json`

**操作**：移除 `dependencies` 中的 `"recharts": "^3.8.1"` 行。

> 删除后需运行 `npm install` 更新 lock file。

#### Step 3.6：删除 Console 相关 CSS

**文件**：`src/styles/globals.css`

**操作**：删除以下 CSS 规则块（按从文件末尾往前删以避免行号偏移问题）：

1. `.chart-placeholder { ... }` 规则块
2. `.chart-frame { ... }` 规则块
3. `.chart-card { ... }` 规则块
4. `.funnel-card::after { ... }` 规则块
5. `.funnel-card { ... }` 规则块
6. `.funnel-grid, .segment-grid { ... }` 规则块
7. `.segment-value { ... }` 规则块
8. `.metric-card strong { ... }` 规则块
9. `.metric-card p { ... }` 规则块（如存在）
10. `.console-stack { ... }` 规则块

在选择器列表中删除 `, .chart-grid` 和 `, .metric-grid`：
- `.dashboard-grid, .task-grid, .review-grid` 复合选择器中原本还包含 `.metric-grid, .chart-grid, .profile-grid`，改为只保留 `.dashboard-grid, .task-grid, .review-grid, .profile-grid`

在 `@media (min-width: 900px)` 中删除：
- `.metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }` 规则块
- `.funnel-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }` 规则块
- `.segment-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }` 规则块

#### Step 3.7：删除 Console 相关测试

删除以下测试文件：

| 目标 | 路径 |
|------|------|
| Analytics 单元测试 | `tests/unit/analytics.spec.ts` |
| Console Overview 单元测试 | `tests/unit/console-overview.spec.ts` |
| Console 组件测试 | `tests/component/console.spec.tsx` |

---

### Phase 4：修复额外潜在 BUG

#### Step 4.1：Review 页面服务端调用去重缓存

**文件**：`src/app/review/page.tsx`

**操作**：在 `ReviewPage` 函数外顶部新增模块级缓存变量：

```typescript
let pendingReviewCache: Promise<{
  summary: string;
  advice: string;
  highlights: string[];
  description: string;
}> | null = null;
```

将无 DB 数据时的 fallback 调用逻辑改为使用缓存：

原代码（文件末尾部分）：
```typescript
const review = await generateWeeklyReview();

return (
  <SiteShell ...>
    <ReviewSummary summary={review.summary} advice={review.advice} highlights={review.highlights} />
  </SiteShell>
);
```

改为：
```typescript
if (!pendingReviewCache) {
  pendingReviewCache = generateWeeklyReview().then((review) => ({
    ...review,
    description: "当前没有数据库里的复盘记录，所以先根据已记录的任务状态和执行感受即时生成一版中文复盘。",
  }));
}
const review = await pendingReviewCache;

return (
  <SiteShell title="本周复盘" description={review.description}>
    <ReviewSummary summary={review.summary} advice={review.advice} highlights={review.highlights} />
  </SiteShell>
);
```

#### Step 4.2：GoalForm 导航方式优化

**文件**：`src/components/goals/goal-form.tsx`

**操作**：

1. 在文件顶部 import 区新增：
```typescript
import { useRouter } from "next/navigation";
```

2. 在 `GoalForm` 函数体内（`useState` 之前）新增：
```typescript
const router = useRouter();
```

3. 将第 65 行的：
```typescript
window.location.assign(nextUrl.toString());
```
改为：
```typescript
router.push(nextUrl.toString());
```

#### Step 4.3：Focus 页面离线模式优化

**文件**：`src/app/focus/page.tsx`

**操作**：将现有返回的 JSX：

```tsx
<FocusSessionCard
  taskId={focusTask?.id}
  taskTitle={focusTask?.title}
  plannedDuration={focusTask?.plannedDuration}
/>
```

改为：

```tsx
{focusTask ? (
  <FocusSessionCard
    taskId={focusTask.id}
    taskTitle={focusTask.title}
    plannedDuration={focusTask.plannedDuration}
  />
) : (
  <section className="shell-panel shell-panel-strong focus-card">
    <p className="section-chip">今日关键动作</p>
    <h2 className="panel-title">还没有正在推进的任务</h2>
    <p className="panel-copy">
      先去「开始计划」创建你的第一个目标，系统会自动帮你拆成今天能开始的小动作。
    </p>
    <a href="/onboarding" className="primary-button">
      去创建目标
    </a>
  </section>
)}
```

#### Step 4.4：Dashboard 页面离线路径兜底

**文件**：`src/app/dashboard/page.tsx`

**操作**：在离线 fallback 分支中（文件最后部分，`goalId = requestedGoalId ?? "goal-demo-1"` 之后），使用 localStorage 的 lastGoalId 兜底：

在文件顶部 import 区新增：
```typescript
import { readLastGoalId } from "@/lib/client/offline-goal-plan";
```

> 注意：DashboardPage 是服务端组件，不能直接调用 `localStorage`。所以在离线 fallback 分支中不使用 localStorage，而是依赖 Step 1.3 中客户端组件 `DashboardOfflineView` 在 mount 后通过 `useEffect` 读取。此处不修改 DashboardPage 服务端代码，仅确保客户端组件 `DashboardOfflineView` 正确兜底。

---

### Phase 5：构建验证与收尾

#### Step 5.1：运行依赖安装

```bash
npm install
```

> 因移除了 `recharts` 依赖，需要更新 lock file。

#### Step 5.2：运行单元测试

```bash
npm run test:unit
```

> 确认删除 console 相关测试后所有测试通过。

#### Step 5.3：运行组件测试

```bash
npm run test:component
```

#### Step 5.4：运行构建

```bash
npm run build
```

> 确认无类型错误、无引用缺失、构建产物正常。

#### Step 5.5：全局搜索验证

依次搜索以下关键词，确认无残留引用：

| 搜索目标 | 预期结果 |
|----------|----------|
| `/console`（在 src 目录） | 0 个页面/API/组件引用 |
| `recharts` | 0 个引用（package.json 已删除） |
| `analytics.ts`（import 语句中） | 0 个引用 |
| `console-overview`（import 语句中） | 0 个引用 |
| `MetricGrid` | 0 个 import |
| `ConversionFunnel` | 0 个 import |
| `SegmentCards` | 0 个 import |
| `ActionTrendChart` | 0 个 import |
| `DelayReasonChart` | 0 个 import |
| `sessionStorage` | 0 个引用（已全改为 `localStorage`） |
| `result_format` | 0 个引用（已从 API 调用中移除） |

#### Step 5.6：更新 README

**文件**：`README.md`

**操作**：

1. 从"当前能力"列表中删除 `- PM 数据后台 /console` 这一行。
2. 确保 Step 2.3 的环境变量文档更新已生效。

---

## 三、不修改项（MVP 范围外）

| 项目 | 原因 |
|------|------|
| 硬编码 `userId: "growthpilot-demo-user"` | MVP 不做用户认证，全链路已统一使用此 userId |
| Profile 页面保留 | 面向普通用户，展示成长档案 |
| 事件追踪 `events.ts` 保留 | 不依赖 console，独立的数据采集模块 |
| E2E 测试 | 项目已明确不保留 E2E 自动化 |
| `.env.local` 不提交 | 已在 `.gitignore` 中排除 |

---

## 四、执行顺序与依赖关系

```
Phase 1（BUG-1 修复）
  Step 1.1 → 1.2 → 1.3 → 1.4（串行，有依赖）

Phase 2（线上大模型调用）
  Step 2.1（修复 API 参数）— 独立
  Step 2.2（wrangler.jsonc 配置）— 独立
  Step 2.3（README 更新）— 独立
  Step 2.4（工作流提示）— 独立
  → 可与 Phase 1 并行，但建议 Phase 1 先行

Phase 3（移除 Console）
  Step 3.1 → 3.7（可按序执行）
  Step 3.4 必须在 Step 3.1/3.2/3.3 之后

Phase 4（额外 BUG 修复）
  Step 4.1 → 4.4（可并行）
  Step 4.3 依赖 Phase 3 完成

Phase 5（验证收尾）
  必须在 Phase 1–4 全部完成后执行
  Step 5.1 → 5.6（严格按序）
```

---

## 五、验收检查清单

在执行AI完成后，验收者需逐项检查：

- [ ] `npm run build` 构建通过，无类型错误
- [ ] `npm run test:unit` 所有测试通过
- [ ] `npm run test:component` 所有测试通过
- [ ] 全局搜索 `/console` 在 `src/` 目录无残留页面引用
- [ ] 全局搜索 `recharts` 无残留依赖
- [ ] 全局搜索 `sessionStorage` 无残留引用
- [ ] 本地 `npm run dev` 启动后：
  - [ ] `/onboarding` 创建目标，大模型返回结果正常（显示"大模型个性化"而非"规则模板"）
  - [ ] 从 Dashboard 跳转至 `/focus`，再通过导航栏返回 Dashboard，大模型结果标识不丢失
  - [ ] `/review` 页面正常显示复盘内容
  - [ ] `/console` 返回 404
  - [ ] 所有页面导航正常，无死链
- [ ] `wrangler.jsonc` 包含 `vars.DASHSCOPE_MODEL`
- [ ] README 已更新，反映 Console 移除和环境变量配置说明