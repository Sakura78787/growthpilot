# GrowthPilot 优化计划文档（第二轮）

> 生成日期：2026-04-16
> 约束条件：不触碰已实现功能，保持代码鲁棒性，不破坏大模型调用特性

---

## 一、前次未完成优化点

### 1.1 SiteShell 默认 description 仍为旧文案

- **现状**：`src/components/layout/site-shell.tsx:21` 默认 description 为"把目标拆成今天就能开始的动作，让每一步都更轻、更稳。"——前次计划应精简但遗漏的口语化旧文案。虽然各页面已显式传入更好的 description，但作为 fallback 仍不一致。
- **优化方案**：将默认 description 改为"将目标拆解为可执行的具体动作。"
- **预期效果**：全站 description fallback 与实际使用文案风格一致。

### 1.2 GoalTimeline nextAction fallback 文案仍口语化

- **现状**：`src/app/goals/[goalId]/page.tsx:103-104` 和 `src/components/goals/goal-detail-offline-view.tsx:102-103` 的 fallback 值仍为"先选一个 20 分钟以内的动作启动起来"、"先开始，再决定要不要继续加码"。
- **优化方案**：
  - `nextActionTitle` fallback → "选择一个 20 分钟内的动作开始"
  - `nextActionMeta` fallback → "先开始第一步"
- **预期效果**：消除最后一批口语化 fallback 文案。

### 1.3 FocusSessionCard starterActions 硬编码文案未优化

- **现状**：`src/components/focus/focus-session-card.tsx:8-12` 三条硬编码建议。
- **优化方案**：改为更通用短句：
  - "将目标拆为 20 分钟内的起步动作"
  - "减少干扰，选择一个低阻力场景"
  - "完成后记录一句今天的关键收获"
- **预期效果**：建议文案更克制通用。

### 1.4 GoalForm 仍在 URL 中传递 planSource/planReason 死参数

- **现状**：`src/components/goals/goal-form.tsx:66-67` 将 `planSource` 和 `planReason` 作为 URL searchParams 传给 `/dashboard`，但 Dashboard 已不再消费这两个参数。
- **优化方案**：从 GoalForm 跳转逻辑中移除 `planSource` 和 `planReason` URL 参数。
- **涉及文件**：`src/components/goals/goal-form.tsx`
- **预期效果**：URL 更简洁。

---

## 二、首页展示优化

### 2.1 Hero 标题换行不美观

- **现状**：`src/components/marketing/hero.tsx:8` 标题"稳稳地前进，而不是用力过猛"在中等屏幕宽度下容易在逗号后断行。当前 CSS 无断行控制。
- **优化方案**：
  1. 为 `.hero-shell h1` 添加 `word-break: keep-all`。
  2. 可选：为后半句加 `<span className="hero-title-accent">`，设置独立颜色或字重差异。
  3. 可在逗号后插入 `<wbr>` 提供更合理的断行点。
- **涉及文件**：`hero.tsx`、`globals.css`
- **预期效果**：标题断行更可控。

### 2.2 首页增加动态效果

- **现状**：Hero 区域纯静态，背景 `.shell-orb` 动效仅用于 SiteShell 内页。
- **优化方案**（纯 CSS）：
  1. `hero-badge` 添加 `fade-in + slight-slide-up` 动画（opacity 0→1 + translateY 12px→0，延迟 0ms）。
  2. h1 延迟 100ms；`hero-copy` 延迟 200ms；`hero-actions` 延迟 300ms。
  3. 底部渐变添加微弱 `hue-rotate` 缓动循环（0→15deg），增加呼吸感。
  4. easing 统一 `cubic-bezier(0.22, 1, 0.36, 1)`，总时长不超过 600ms。
  5. `@media (prefers-reduced-motion: reduce)` 下禁用所有动画。
- **涉及文件**：`hero.tsx`、`globals.css`
- **预期效果**：首页入场节奏更灵动，且不影响无障碍。

### 2.3 首页 kicker 文案调整

- **现状**：`hero.tsx:7` 为"面向中国大陆大学生的成长驾驶舱"。限定词过窄。
- **优化方案**：改为"你的成长驾驶舱"或"面向所有人的成长驾驶舱"。
- **预期效果**：产品定位更开放。

### 2.4 首页 hero-copy 删除"中文、"

- **现状**：`hero.tsx:10` 为"用中文、温和且可解释的数据反馈，帮你推进自律、学习和求职目标。"
- **优化方案**：改为"温和可解释的数据反馈，帮你推进自律、学习和求职目标。"
- **预期效果**：文案更精炼。

---

## 三、TodayPanel 时间建议动态化

### 3.1 所有任务统一展示"适合在今晚 20:00 - 22:00 之间推进"

- **现状**：`today-panel.tsx:32` 硬编码 meta 文案为固定时段，不区分目标类型或用户偏好。
- **优化方案**：
  1. TodayPanel 增加可选 prop `preferredWindow?: string | null`。
  2. 有 `preferredWindow` 时，meta 改为"适合在 {preferredWindow} 推进"；无数据时使用"按自身节奏推进"。
  3. Dashboard 页面从 profile 数据提取偏好时段传入；DashboardOfflineView 传入 null。
- **涉及文件**：`today-panel.tsx`、`dashboard/page.tsx`、`dashboard-offline-view.tsx`
- **预期效果**：任务时间建议有数据时展示真实偏好，无数据时展示通用文案。

---

## 四、Focus 页面跳转展示（已优化，确认完毕）

前次优化已完成 FocusOfflineView 的空状态引导和 FocusSessionCard 完成后的跳转链接，无需额外操作。

---

## 五、其他优化点

### 5.2 DashboardOfflineView categoryLabel 手动映射

- **现状**：`dashboard-offline-view.tsx:44-45` 使用三元表达式映射，而 `goals.ts` 已导出 `goalCategoryLabels`。
- **优化方案**：导入 `goalCategoryLabels` 并使用。
- **预期效果**：category 标签逻辑统一。

### 5.3 GoalForm 错误提示文案优化

- **现状**：`goal-form.tsx:49` "生成计划时出现了点小问题，请稍后再试。"; `:70` "当前网络有点慢，再试一次就好。"
- **优化方案**：
  - `:49` → "计划生成失败，请稍后重试。"
  - `:70` → "网络请求失败，请重试。"

### 5.4 FocusSessionCard 错误提示文案优化

- **现状**：`focus-session-card.tsx:64` "这次开始记录失败了，稍后再试一下。"; `:84` "这次完成记录没有成功，先别急，等会再试一次。"
- **优化方案**：
  - `:64` → "记录开始失败，请稍后重试。"
  - `:84` → "记录完成失败，请稍后重试。"

### 5.5 Profile "继续今日行动"跳转安全化

- **现状**：`profile-summary.tsx:40-42` "继续今日行动"链接指向 `/focus`，无任务时进入空状态。
- **优化方案**：MVP 阶段将此按钮改为链接到 `/dashboard`（文案改为"回到驾驶舱"），避免跳入空 Focus。
- **涉及文件**：`profile-summary.tsx`
- **预期效果**：避免从档案页跳入无意义空页面。

### 5.6 GoalDetail description 文案统一

- **现状**：`goals/[goalId]/page.tsx:48` 为"这里优先展示已经写进数据库的阶段里程碑和任务状态，让目标不再只是一个标题。"——暴露技术细节。
- **优化方案**：改为"查看目标的阶段拆解与任务进度。"

### 5.7 Profile recentHighlight 口语化文案优化

- **现状**：`profile.ts:99` 有"说明你已经开始把大目标压缩成可启动的小步"；`profile.ts:102` 有"先在这个时间窗里保住一个 20 分钟动作就足够"。
- **优化方案**：
  - `:99` → "已完成 {doneCount} 个关键动作，{doingCount} 个正在推进。"
  - `:102` → "建议在 {preferredWindowLabel} 安排一个核心动作。"

---

## 六、实施优先级

| 优先级 | 编号 | 改动项 |
|---|---|---|
| P0 | 2.3 | 首页 kicker 改为面向大众表述 |
| P0 | 2.4 | 首页 hero-copy 删除"中文、" |
| P0 | 3.1 | TodayPanel 时间建议动态化 |
| P1 | 2.1 | Hero 标题断行控制 |
| P1 | 2.2 | 首页入场动画 |
| P1 | 1.1 | SiteShell 默认 description 更新 |
| P1 | 1.2 | GoalTimeline fallback 文案优化 |
| P1 | 1.3 | FocusSessionCard starterActions 文案优化 |
| P1 | 5.4 | FocusSessionCard 错误提示优化 |
| P1 | 1.4 | GoalForm 移除死 URL 参数 |
| P2 | 5.2 | Dashboard Offline View category 映射统一 |
| P2 | 5.3 | GoalForm 错误提示文案优化 |
| P2 | 5.5 | Profile 跳转安全化 |
| P2 | 5.6 | GoalDetail description 文案统一 |
| P2 | 5.7 | Profile recentHighlight 口语化文案优化 |

---

## 七、约束检查清单

- [ ] 大模型调用链路未被修改行为
- [ ] LLM 回退逻辑不变
- [ ] 数据库 schema 不受影响
- [ ] API 端点签名和返回结构不变
- [ ] `next build` 通过
- [ ] `npm run test:unit` 和 `npm run test:component` 通过
- [ ] 不引入新的第三方依赖
- [ ] 尊重 `prefers-reduced-motion` 无障碍要求