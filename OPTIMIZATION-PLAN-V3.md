# GrowthPilot 优化计划文档 V3

> 生成日期：2026-04-16
> 约束条件：不触碰已实现功能，保持代码鲁棒性，不破坏大模型调用特性
> 核心问题：用户生成计划后，点击"开始今天的关键动作"进入 Focus 页面，看到的是规则模板的默认内容而非自己生成的计划内容

---

## 一、核心问题分析：Focus 页面跳转后显示默认内容

### 根因分析

用户完成计划的完整路径如下：

1. `/onboarding` → GoalForm 提交 → API 返回含 planSeed 的响应 → 存入 localStorage → 跳转 `/dashboard`
2. Dashboard 显示用户生成的计划任务 → 点击"开始今天的关键动作" → 跳转 `/focus`
3. `/focus` 是 Server Component → 尝试从数据库取任务

**问题出在第 3 步**。Focus 页面展示逻辑存在多个风险点：

#### 风险点 A：FocusSessionCard 具有硬编码 fallback 默认值

`focus-session-card.tsx:25-27` 中：
```typescript
taskId = "task-demo-1",
taskTitle = "完成 20 分钟简历优化",
plannedDuration = 20,
```

当任何路径（DB 分支或 localStorage 分支）意外传入空值或任一 prop 缺失时，组件会显示"完成 20 分钟简历优化"——这个完全固定的默认内容，与用户生成的计划毫不相关。

#### 风险点 B：Focus 页面不接收任何上下文参数

所有跳转到 `/focus` 的链接（TodayPanel、GoalTimeline、GoalDetail）都是 `<Link href="/focus">` 硬编码，没有携带 goalId 或 taskId。这意味着 Focus 页面必须完全自行决定显示什么内容。

- 有 DB 时：`getFocusTask(db)` 查找第一个 doing/todo 任务 → 如果找到就用 FocusSessionCard 显示
- 无 DB 时：`FocusOfflineView` 从 localStorage 读取 → 如果有缓存就用 FocusSessionCard 显示

#### 风险点 C：FocusOfflineView 的 localStorage 读取顺序

`FocusOfflineView` 先按目标 ID 查找，失败后再按 lastGoalId 查找。如果在 SSR 阶段（读取前）显示空白/null，客户端 hydration 后才展示结果，中间可能有闪烁。

#### 风险点 D：规则模板作为 fallback 的硬编码内容

`seed-data.ts` 中的 `buildDisciplinePlan()` 返回固定的自律类任务（"今晚 23:30 前关闭短视频"、"洗漱后不再打开社交应用"等），`buildStudyPlan` 和 `buildJobPlan` 也是固定模板。当 DB 不可用且 localStorage 也无数据时，DashboardOfflineView 会使用这些硬编码内容作为 fallback，但 Focus 页面在同样情况下只会显示"请先创建目标"——体验不一致。

#### 用户实际遭遇的场景（最可能）

用户描述的"放下手机的默认文案"最可能对应 `buildDisciplinePlan()` 的第二项任务"洗漱后不再打开社交应用"。这说明用户选择了"自律"类型目标，LLM 未配置或调用失败，回退到规则模板。Dashboard 展示的是规则模板内容（这些任务本身没问题，只是不够个性化），然后 Focus 页面也展示相同的规则模板内容或默认任务——看起来是"默认"的。

**但更关键的是**：即使 LLM 调用成功生成了个性化计划，Focus 页面也可能因为数据库查询时机、D1 延迟等原因取不到刚创建的任务，导致显示默认内容。

---

## 二、Focus 页面核心优化方案

### 2.1 FocusSessionCard 移除硬编码默认值，强制必须传参

- **现状**：`FocusSessionCard` 的 `taskId`、`taskTitle`、`plannedDuration` 三个 props 都有默认值，当无意传入空值时会展示无关默认内容。
- **优化方案**：
  1. 将 `taskTitle` 和 `plannedDuration` 的默认值移除（改为必需 props）。
  2. `taskId` 保留默认值 `"task-demo-1"`（给无 DB 模式的 fallback 使用）。
  3. 在 `FocusPage`（server component）和 `FocusOfflineView` 中确保只传来自真实数据的值。
- **预期效果**：彻底杜绝显示"完成 20 分钟简历优化"等无关默认内容。

### 2.2 FocusOfflineView 增加 loading 态，消除 SSR 闪烁

- **现状**：`FocusOfflineView` 在 `ready=false` 时返回 `null`，SSR 阶段页面短暂空白后才显示内容。
- **优化方案**：在 `ready=false` 时返回一个轻量 skeleton 占位（如 `<section className="shell-panel shell-panel-strong"><p className="panel-title">加载中...</p></section>`），避免空白闪烁。
- **涉及文件**：`focus-offline-view.tsx`
- **预期效果**：Focus 页面从不出现空白或闪烁。

### 2.3 Focus 页面 localStorage 缓存读取优化

- **现状**：`FocusOfflineView` 只读 `lastGoalId` 对应的 plan，不读 URL 参数传入的 goalId。但 Dashboard offline view 传递给 Focus 的仍然是 `/focus`（无参数）。
- **优化方案**：在 Dashboard 和 GoalDetail 页面跳转到 `/focus` 时，携带 `goalId` 参数（如 `/focus?goalId=xxx`），使 Focus 页面可以直接定位目标，而非仅依赖 lastGoalId。
  1. `TodayPanel` 的"开始今天的关键动作"链接改为 `/focus`（无参数即可，server component 会从 DB 取）
  2. `GoalTimeline` 的"去今日行动页"链接改为 `/focus?goalId={goalId}`
  3. `GoalDetailOfflineView` 和 `goals/[goalId]/page.tsx` 的"继续今日行动"链接改为 `/focus?goalId={goalId}`
  4. Focus server component 从 `searchParams` 读取 `goalId`，优先查该目标的 doing/todo 任务
- **涉及文件**：`focus/page.tsx`, `goal-timeline.tsx`, `goal-detail-offline-view.tsx`, `goals/[goalId]/page.tsx`, `today-panel.tsx`
- **预期效果**：从目标详情页进入 Focus 时，精确定位到该目标下的任务，不再展示默认或其他目标的内容。

### 2.4 Focus 页面 server component 增加 goalId 查询逻辑

- **现状**：`focus/page.tsx` 中 `getFocusTask(db)` 只取全局第一个 doing/todo 任务，不限定目标。
- **优化方案**：
  1. 新增或修改查询函数，支持按 `goalId` 筛选任务。
  2. 如果 URL 带 `goalId`，优先查该目标下的 doing/todo 任务。
  3. 如果不带 `goalId` 或该目标无任务，再 fallback 到全局查询。
- **涉及文件**：`lib/db/queries/tasks.ts`, `app/focus/page.tsx`
- **预期效果**：从特定目标进入 Focus 时，显示该目标下的任务而非全局第一个任务。

---

## 三、前次残留优化点

### 3.1 SiteShell 默认 description（已完成 ✅）

已改为"将目标拆解为可执行的具体动作。"

### 3.2 GoalTimeline fallback 文案（已完成 ✅）

已改为"选择一个 20 分钟内的动作开始" / "先开始第一步"

### 3.3 FocusSessionCard starterActions（已完成 ✅）

已改为更通用短句。

### 3.4 GoalForm 死 URL 参数（已完成 ✅）

已移除 `planSource`/`planReason`。

### 3.5 今日时间建议动态化（已完成 ✅）

TodayPanel 已支持 `preferredWindow` prop。

### 3.6 首页展示优化（已完成 ✅）

动画、标题断行、kicker、copy 都已实现。

---

## 四、V2 验收残留的新优化点

### 4.1 profile.ts fallback advice 仍有口语化表述

- **现状**：`src/lib/db/queries/profile.ts:129-130`：
  ```
  `下周优先把"${firstDelayReason}"相关任务继续拆小。`
  `下周继续把动作放在 ${preferredWindowLabel}，先从能在 20 分钟内开始的一步起步。`
  ```
  "继续拆小"、"先从能在 20 分钟内开始的一步起步"仍偏口语化。
- **优化方案**：
  - 改为 `下周优先处理「${firstDelayReason || '阻碍'}」相关任务。`
  - 改为 `下周建议在 ${preferredWindowLabel} 安排一个可启动的核心动作。`
- **涉及文件**：`src/lib/db/queries/profile.ts`

### 4.2 profile.ts badge "会复盘"/"边做边校准"

- **现状**：`profile.ts:90` 中 `reviewsInput.length > 0 ? "会复盘" : "边做边校准"`。由于"本周复盘"功能已移除（V1 优化），"会复盘"badge 永远不会出现，"边做边校准"成为固定 badge。
- **优化方案**：简化为固定 badge `"持续积累"` 或保留现状（不影响功能，仅语义上不对称）。
- **涉及文件**：`src/lib/db/queries/profile.ts`

### 4.3 profile.ts recentHighlight 仍有一处口语化

- **现状**：`profile.ts:130`：`下周继续把动作放在 ${preferredWindowLabel}，先从能在 20 分钟内开始的一步起步。`
- **优化方案**：已在 V2 验收中部分处理（`:102` 已改为"建议在...安排一个核心动作"），但 `:130` 尚未处理，需同步修改。
- **涉及文件**：`src/lib/db/queries/profile.ts`

### 4.4 DashboardOfflineView 未传 preferredWindow 给 TodayPanel

- **现状**：`dashboard-offline-view.tsx:58` 的 `<TodayPanel streak={streak} tasks={tasks} />` 未传 `preferredWindow` prop，导致离线模式下 TodayPanel 显示"按自身节奏推进"而非更有意义的内容。
- **优化方案**：给 DashboardOfflineView 添加一个可选 `preferredWindow` prop 或从 localStorage 读取偏好时段传入 TodayPanel。MVP 阶段可直接传 `null`（当前行为已可接受，但与其他不一致）。
- **影响**：低优先级，功能不受影响，仅文案一致性。

---

## 五、实施优先级

| 优先级 | 编号 | 改动项 | 涉及文件 |
|---|---|---|---|
| P0 | 2.1 | FocusSessionCard 移除硬编码默认值 | `focus-session-card.tsx` |
| P0 | 2.3 | Focus 链接携带 goalId 参数 | `today-panel.tsx`, `goal-timeline.tsx`, `goal-detail-offline-view.tsx`, `goals/[goalId]/page.tsx` |
| P0 | 2.4 | Focus server component 支持 goalId 查询 | `focus/page.tsx`, `tasks.ts` |
| P1 | 2.2 | FocusOfflineView 增加 loading 态 | `focus-offline-view.tsx` |
| P1 | 4.1 | profile.ts fallback advice 口语化优化 | `profile.ts` |
| P1 | 4.3 | profile.ts line 130 口语化优化 | `profile.ts` |
| P2 | 4.2 | profile badge "会复盘" 语义不对称 | `profile.ts` |
| P2 | 4.4 | DashboardOfflineView 传 preferredWindow 给 TodayPanel | `dashboard-offline-view.tsx` |

---

## 六、约束检查清单

- [ ] 大模型调用链路未被修改
- [ ] LLM 回退逻辑不变
- [ ] 数据库 schema 不受影响
- [ ] Focus 页面跳转在 DB 可用和不可用两种场景下都正确显示用户生成的任务
- [ ] `next build` 通过
- [ ] `npm run test:unit` 和 `npm run test:component` 通过