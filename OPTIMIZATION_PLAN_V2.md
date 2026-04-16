# GrowthPilot MVP 修复执行计划书（第二轮）

> 基于上一轮优化的代码现状，修复两个阻断性 BUG，确保 MVP 全链路可用。

---

## 一、问题诊断

### 问题 1：线上 Cloudflare 部署后大模型调用未生效

**现象**：阿里云 DashScope 后台显示调用成功，但前端仍显示兜底文案（规则模板）。

**根因**：`generatePersonalizedGoalPlan` 和 `generateWeeklyReview` 通过 `process.env.DASHSCOPE_API_KEY` 读取 API Key。在 Cloudflare Workers 运行时中，`process.env` 不包含 Worker 绑定的环境变量和密钥——它们只能通过 `getCloudflareContext().env` 访问。因此线上代码走到：

```typescript
const apiKey = process.env.DASHSCOPE_API_KEY?.trim(); // undefined
if (!apiKey) {
  return fallback; // 直接返回兜底结果，从未调用 API
}
```

阿里云后台的"调用成功"记录来自本地测试，非线上请求。

**影响范围**：目标计划和周复盘两处大模型调用全部失效。

### 问题 2：本地创建目标后进入 Focus 页面显示「没有正在推进的任务」

**现象**：在 `/onboarding` 创建目标后跳到 Dashboard 正常，但点进「今日行动」显示空提示。

**根因**：Focus 页面是服务端组件，依赖 D1 数据库查询任务。本地 `npm run dev` 没有真实 D1 连接，`focusTask` 为 null。新创建的目标数据保存在 `localStorage` 中，但 Focus 页面没有客户端组件读取 `localStorage`。

**影响范围**：本地开发和无 DB 场景的 Focus 页面完全不可用。

---

## 二、修复步骤

### Phase 1：修复大模型调用环境变量传递（阻断级）

#### Step 1.1：改造 goal-planner 接受外部传入的 API Key

**文件**：`src/lib/ai/goal-planner.ts`

**操作**：

1. 在文件顶部 `PersonalizedGoalPlan` 类型之后新增：

```typescript
export type GoalPlannerOptions = {
  apiKey?: string;
  model?: string;
};
```

2. 修改 `generatePersonalizedGoalPlan` 函数签名，新增 `options` 参数：

```typescript
export async function generatePersonalizedGoalPlan(
  input: GoalRequest,
  options?: GoalPlannerOptions,
): Promise<PersonalizedGoalPlan> {
```

3. 修改函数体中 apiKey 和 model 取值逻辑（原第 91-92 行）：

原代码：
```typescript
const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
const model = process.env.DASHSCOPE_MODEL?.trim() || defaultModel;
```

改为：
```typescript
const apiKey = options?.apiKey?.trim() || process.env.DASHSCOPE_API_KEY?.trim();
const model = options?.model?.trim() || process.env.DASHSCOPE_MODEL?.trim() || defaultModel;
```

4. 导出 `GoalPlannerOptions` 类型（已通过 `export type` 导出）。

#### Step 1.2：改造 review-generator 接受外部传入的 API Key

**文件**：`src/lib/ai/review-generator.ts`

**操作**：

1. 在文件顶部 `defaultModel` 常量之后、`defaultReviewInput` 之前新增：

```typescript
export type ReviewGeneratorOptions = {
  apiKey?: string;
  model?: string;
};
```

2. 修改 `generatePersonalizedReview` 函数签名，新增 `options` 参数：

```typescript
async function generatePersonalizedReview(
  input: WeeklyReviewFallbackInput,
  options?: ReviewGeneratorOptions,
): Promise<WeeklyReviewFallback> {
```

3. 修改函数体中 apiKey 和 model 取值逻辑（原第 44-45 行）：

原代码：
```typescript
const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
const model = process.env.DASHSCOPE_MODEL?.trim() || defaultModel;
```

改为：
```typescript
const apiKey = options?.apiKey?.trim() || process.env.DASHSCOPE_API_KEY?.trim();
const model = options?.model?.trim() || process.env.DASHSCOPE_MODEL?.trim() || defaultModel;
```

4. 修改 `generateWeeklyReview` 函数签名，新增 `options` 参数并透传：

原代码：
```typescript
export async function generateWeeklyReview(
  input: Partial<WeeklyReviewFallbackInput> = {},
): Promise<WeeklyReviewFallback> {
  const merged = mergeWeeklyReviewInput(input);
  return generatePersonalizedReview(merged);
}
```

改为：
```typescript
export async function generateWeeklyReview(
  input: Partial<WeeklyReviewFallbackInput> = {},
  options?: ReviewGeneratorOptions,
): Promise<WeeklyReviewFallback> {
  const merged = mergeWeeklyReviewInput(input);
  return generatePersonalizedReview(merged, options);
}
```

#### Step 1.3：扩展 CloudflareEnv 类型

**文件**：`src/lib/cloudflare/env.ts`

**操作**：修改 `CloudflareEnv` 类型，增加大模型相关可选字段：

原代码：
```typescript
export type CloudflareEnv = {
  DB: AnyD1Database;
};
```

改为：
```typescript
export type CloudflareEnv = {
  DB: AnyD1Database;
  DASHSCOPE_API_KEY?: string;
  DASHSCOPE_MODEL?: string;
};
```

#### Step 1.4：Goals API 路由传入 Cloudflare 环境变量

**文件**：`src/app/api/goals/route.ts`

**操作**：

1. 新增 import：

```typescript
import { type GoalPlannerOptions } from "@/lib/ai/goal-planner";
```

2. 将 `env` 的获取从 `personalized` 调用之后移到之前，并构造 AI options：

原代码（第 14-16 行起）：
```typescript
const payload = goalRequestSchema.parse(await request.json());
const personalized = await generatePersonalizedGoalPlan(payload);

const profileSnapshot = { ... };

const env = await getOptionalCloudflareEnv();
const db = env?.DB ? getDb(env) : null;
```

改为：
```typescript
const payload = goalRequestSchema.parse(await request.json());
const env = await getOptionalCloudflareEnv();
const aiOptions: GoalPlannerOptions = {
  apiKey: (env?.DASHSCOPE_API_KEY as string | undefined) || process.env.DASHSCOPE_API_KEY,
  model: (env?.DASHSCOPE_MODEL as string | undefined) || process.env.DASHSCOPE_MODEL,
};
const personalized = await generatePersonalizedGoalPlan(payload, aiOptions);

const profileSnapshot = { ... };

const db = env?.DB ? getDb(env) : null;
```

注意：删除原第 25 行的 `const env = await getOptionalCloudflareEnv();`，因为已提前获取。

#### Step 1.5：Review API 路由传入 Cloudflare 环境变量

**文件**：`src/app/api/reviews/generate/route.ts`

**操作**：

1. 新增 import：

```typescript
import { type ReviewGeneratorOptions } from "@/lib/ai/review-generator";
```

2. 在 `const env = ...` 之后（已有行），新增 aiOptions 构造：

```typescript
const env = await getOptionalCloudflareEnv();
const db = env?.DB ? getDb(env) : null;
const aiOptions: ReviewGeneratorOptions = {
  apiKey: (env?.DASHSCOPE_API_KEY as string | undefined) || process.env.DASHSCOPE_API_KEY,
  model: (env?.DASHSCOPE_MODEL as string | undefined) || process.env.DASHSCOPE_MODEL,
};
```

3. 在 DB 模式下调用 `generateWeeklyReview` 时传入 aiOptions：

原代码（约第 35 行）：
```typescript
const review = await generateWeeklyReview(merged);
```

改为：
```typescript
const review = await generateWeeklyReview(merged, aiOptions);
```

4. 在 fallback 模式下调用 `generateWeeklyReview` 时传入 aiOptions（约第 57 行）：

原代码：
```typescript
return NextResponse.json(await generateWeeklyReview(payload));
```

改为：
```typescript
return NextResponse.json(await generateWeeklyReview(payload, aiOptions));
```

#### Step 1.6：Review 页面服务端组件传入 Cloudflare 环境变量

**文件**：`src/app/review/page.tsx`

**操作**：

1. 新增 import：

```typescript
import { type ReviewGeneratorOptions } from "@/lib/ai/review-generator";
```

2. 在 `const env = ...`（已有行）之后新增 aiOptions 构造：

```typescript
const env = await getOptionalCloudflareEnv();
const db = env?.DB ? getDb(env) : null;
const aiOptions: ReviewGeneratorOptions = {
  apiKey: (env?.DASHSCOPE_API_KEY as string | undefined) || process.env.DASHSCOPE_API_KEY,
  model: (env?.DASHSCOPE_MODEL as string | undefined) || process.env.DASHSCOPE_MODEL,
};
```

3. 在 DB 模式下的 `generateWeeklyReview` 调用传入 aiOptions（约第 37 行）：

原代码：
```typescript
const review = await generateWeeklyReview(source);
```

改为：
```typescript
const review = await generateWeeklyReview(source, aiOptions);
```

4. 在无 DB 的 fallback 模式下（`pendingReviewCache` 逻辑处，约第 64 行）：

原代码：
```typescript
pendingReviewCache = generateWeeklyReview().then((review) => ({
```

改为：
```typescript
pendingReviewCache = generateWeeklyReview(undefined, aiOptions).then((review) => ({
```

---

### Phase 2：修复 Focus 页面离线不可用（阻断级）

#### Step 2.1：创建 FocusOfflineView 客户端组件

**新建文件**：`src/components/focus/focus-offline-view.tsx`

**内容**：

```tsx
"use client";

import { useEffect, useState } from "react";

import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { readLastGoalId, readOfflineGoalPlan } from "@/lib/client/offline-goal-plan";
import { buildGoalPlan, type GoalCategory } from "@/lib/mock/seed-data";

type FocusOfflineViewProps = {
  fallbackGoalTitle?: string;
  fallbackCategory?: GoalCategory;
};

export function FocusOfflineView({
  fallbackGoalTitle = "完成 20 分钟简历优化",
  fallbackCategory = "job",
}: FocusOfflineViewProps) {
  const [taskInfo, setTaskInfo] = useState<{
    id: string;
    title: string;
    duration: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lastGoalId = readLastGoalId();
    if (lastGoalId) {
      const stored = readOfflineGoalPlan(lastGoalId);
      if (stored?.planSeed) {
        const firstTask = stored.planSeed.tasks[0];
        if (firstTask) {
          setTaskInfo({
            id: `${lastGoalId}-task-1`,
            title: firstTask.title,
            duration: firstTask.suggestedDuration,
          });
        }
      }
    }
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  if (taskInfo) {
    return (
      <FocusSessionCard
        taskId={taskInfo.id}
        taskTitle={taskInfo.title}
        plannedDuration={taskInfo.duration}
      />
    );
  }

  const plan = buildGoalPlan({ title: fallbackGoalTitle, category: fallbackCategory });
  const firstTask = plan.tasks[0];

  return (
    <FocusSessionCard
      taskId="task-demo-1"
      taskTitle={firstTask?.title ?? fallbackGoalTitle}
      plannedDuration={firstTask?.suggestedDuration ?? 20}
    />
  );
}
```

#### Step 2.2：修改 Focus 页面引入离线视图

**文件**：`src/app/focus/page.tsx`

**操作**：将整个文件替换为：

```tsx
import { FocusOfflineView } from "@/components/focus/focus-offline-view";
import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { getFocusTask } from "@/lib/db/queries/tasks";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;
  const focusTask = db
    ? await runWithOptionalDbFallback(() => getFocusTask(db), null)
    : null;

  return (
    <SiteShell
      title="今日行动"
      description="先从一个能开始的动作出发，把拖延压低一点，把今天的节奏轻轻拉回来。"
    >
      {focusTask ? (
        <FocusSessionCard
          taskId={focusTask.id}
          taskTitle={focusTask.title}
          plannedDuration={focusTask.plannedDuration}
        />
      ) : (
        <FocusOfflineView />
      )}
    </SiteShell>
  );
}
```

---

### Phase 3：验证与收尾

#### Step 3.1：构建验证

```bash
npm run build
```

确认无类型错误、无引用缺失。

#### Step 3.2：单元测试

```bash
npm run test:unit
```

#### Step 3.3：组件测试

```bash
npm run test:component
```

#### Step 3.4：全局搜索确认

| 搜索目标 | 预期结果 |
|----------|----------|
| `GoalPlannerOptions` | 在 `goal-planner.ts` 定义，在 `goals/route.ts` 使用 |
| `ReviewGeneratorOptions` | 在 `review-generator.ts` 定义，在 `reviews/generate/route.ts` 和 `review/page.tsx` 使用 |
| `aiOptions` | 在 3 个文件中出现：`goals/route.ts`、`reviews/generate/route.ts`、`review/page.tsx` |
| `FocusOfflineView` | 在 `focus/page.tsx` import 并使用 |
| `process.env.DASHSCOPE` | 仍在 `goal-planner.ts` 和 `review-generator.ts` 中作为 fallback |
| `DASHSCOPE_API_KEY` 在 `env.ts` | 类型定义中存在 |

---

## 三、修改文件清单

| 文件 | 操作类型 |
|------|----------|
| `src/lib/ai/goal-planner.ts` | 修改：新增 `GoalPlannerOptions` 类型和 options 参数 |
| `src/lib/ai/review-generator.ts` | 修改：新增 `ReviewGeneratorOptions` 类型、options 参数、透传 |
| `src/lib/cloudflare/env.ts` | 修改：`CloudflareEnv` 增加大模型字段 |
| `src/app/api/goals/route.ts` | 修改：提前获取 env，构造 aiOptions 传入 |
| `src/app/api/reviews/generate/route.ts` | 修改：构造 aiOptions 传入 |
| `src/app/review/page.tsx` | 修改：构造 aiOptions 传入 |
| `src/components/focus/focus-offline-view.tsx` | **新建**：Focus 离线视图组件 |
| `src/app/focus/page.tsx` | 修改：引入 FocusOfflineView 替代纯文字 fallback |

共 **8 个文件**（7 修改 + 1 新建）。

---

## 四、核心逻辑验证方式

### 线上大模型调用验证（部署后）

1. 部署到 Cloudflare
2. 确认已设置 Cloudflare Worker Secret：`npx wrangler secret put DASHSCOPE_API_KEY`
3. 访问 `/onboarding`，输入目标信息并提交
4. Dashboard 页面应显示「生成方式：大模型个性化」而非「规则模板」
5. 访问 `/review`，复盘内容应为中文个性化文案而非模板文案

### Focus 页面验证（本地）

1. `npm run dev` 启动
2. 访问 `/onboarding`，创建目标
3. 从 Dashboard 点击「开始今天的关键动作」进入 `/focus`
4. 确认显示第一个任务（来自 localStorage 缓存），且有「开始专注」按钮
5. 从导航栏直接访问 `/focus`，确认仍能显示最近目标的任务

---

## 五、不修改项

| 项目 | 原因 |
|------|------|
| `process.env.DASHSCOPE_API_KEY` 保留在 AI 模块 | 作为本地开发 fallback，不删除 |
| Dashboard / GoalDetail 离线视图 | 上一轮已修复，本次不动 |
| Review 缓存逻辑 | 上一轮已加 pendingReviewCache，本次仅加 options 透传 |
| `wrangler.jsonc` | 上一轮已添加 `DASHSCOPE_MODEL` 到 vars |
| `localStorage` 存储逻辑 | 上一轮已改 sessionStorage 为 localStorage |