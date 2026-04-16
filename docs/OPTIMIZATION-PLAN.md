# GrowthPilot 优化计划文档

> 生成日期：2026-04-16
> 约束条件：保证代码可维护性和整体安全性，不得破坏已成功实现的大模型调用特性

---

## 一、首页 UI 与按钮梳理

### 1.1 去除"查看成长趋势"按钮

- **现状**：`src/components/marketing/hero.tsx:16-18` 中 `/review` 被标注为"查看成长趋势"，但实际跳转到周复盘页面，并非趋势图表，命名具有误导性；且该按钮与"本周复盘"导航入口功能重复。
- **优化方案**：移除 `Hero` 组件中 `hero-secondary` 链接（`/review`），仅保留"开始今日行动"（`/onboarding`）这一个主入口按钮。首页应聚焦引导用户创建目标。
- **预期效果**：首页入口更清晰，消除误导性跳转。

### 1.2 导航栏"本周复盘"入口

- **现状**：`src/components/layout/site-shell.tsx:16` 导航栏包含"本周复盘"链接指向 `/review`。
- **优化方案**：按照任务要求去除"本周复盘"相关入口和功能。详见第七节。
- **预期效果**：导航栏仅保留"首页"、"开始计划"、"成长驾驶舱"三项，流程更精简。

---

## 二、文案优化

### 2.1 SiteShell hero 卡片固定标签

- **现状**：`src/components/layout/site-shell.tsx:46` 每个页面顶部均展示硬编码 `section-chip`："轻盈推进，不用硬扛"。该标签对所有页面语境不适配。
- **优化方案**：移除该硬编码 `section-chip`，改为各页面通过 props 传入与当前功能匹配的标签，或直接删除。
- **预期效果**：各页面标题区域不再粘贴全站统一口号，更专业。

### 2.2 Dashboard 页面文案

- **现状**：`src/app/dashboard/page.tsx:73` description 为"把目标拆成今天就能开始的动作，同时保留一点轻盈感，让推进这件事没那么累。"
- **优化方案**：改为更简洁专业的表述，如"将目标拆解为今日可执行的具体动作"。
- **涉及文件**：
  - `src/app/dashboard/page.tsx:73`
  - `src/components/dashboard/dashboard-offline-view.tsx:65`（同步修改）

### 2.3 去除"生成方式"等开发者提示

- **现状**：
  - `src/app/dashboard/page.tsx:87-88`：`生成方式：{badge.source === "llm" ? "大模型个性化" : "规则模板"}。{badge.reason}`
  - `src/components/dashboard/dashboard-offline-view.tsx:79`：`生成方式：{planSource === "llm" ? "大模型个性化" : "规则模板"}。{planReason}`
  - 两处均在用户界面上暴露了内部实现细节（"大模型个性化"、"规则模板"），对用户而言是突兀的开发者词汇。
- **优化方案**：完全删除"生成方式"相关文案及 `resolvePlanBadgeFromSnapshot` 函数和相关导入。`planSource` 数据保留用于内部逻辑判断，但不再展示给用户。同时移除"系统已经优先从真实数据记录里读取你的阶段任务与推进状态。"这类过于技术性的描述。
- **涉及文件**：
  - `src/app/dashboard/page.tsx`（删除 `resolvePlanBadgeFromSnapshot` 函数、删除 badge 相关 JSX）
  - `src/components/dashboard/dashboard-offline-view.tsx`（删除 `planSource`/`planReason` 相关 props 和 JSX）
  - `src/components/dashboard/dashboard-offline-view.tsx:58-60` 中 `planCopy` 文案精简
- **预期效果**：消除对用户的突兀技术提示，界面更干净。

### 2.4 Focus 页面文案

- **现状**：`src/app/focus/page.tsx:20-21` description："先从一个能开始的动作出发，把拖延压低一点，把今天的节奏轻轻拉回来。"
- **优化方案**：改为更直接的表达，如"完成今日关键动作，逐步推进目标"。

### 2.5 FocusSessionCard 文案

- **现状**：
  - `src/components/focus/focus-session-card.tsx:91`："别急着把一整个项目一次做完，先把最难开始的部分压缩到 {plannedDuration} 分钟，身体会更愿意配合你开始。"
  - `src/components/focus/focus-session-card.tsx:98`："轻量起步，更容易进入状态"
  - `src/components/focus/focus-session-card.tsx:177`："很好，先完成这一小步，今天的节奏就已经被你拉回来了。"
- **优化方案**：替换为更简洁专业的表述：
  - → "将任务拆解为 {plannedDuration} 分钟的起步动作"
  - → "专注 {plannedDuration} 分钟"
  - → "已完成今日关键动作"

### 2.6 TodayPanel 文案

- **现状**：`src/components/dashboard/today-panel.tsx:21-22`："今天先完成 3 个关键动作"、"先把最难开始的事情压缩到 20 分钟以内，你会更容易动起来。"
- **优化方案**：将"3 个关键动作"改为动态数量（实际 tasks 数量），后半句改为更克制简洁的表述如"逐步完成今日安排的动作"。
- **涉及改动**：TodayPanel 需接收 tasks 数量或自行计算标题。

### 2.7 InsightPanel 文案

- **现状**：`src/components/dashboard/insight-panel.tsx:7-9`："你不是做不到，只是需要更轻的起步动作"、"你在晚上 20:00 到 22:00 的执行效率更高。把任务拆成 20 分钟动作后，真正开始的概率会明显提升。"
- **优化方案**：改为更数据驱动、更克制的表述。标题改为"本周推进建议"，内容不再使用主观判断文案，改为根据实际数据展示或给出通用但非虚假的提示。

### 2.8 Onboarding 页面文案

- **现状**：`src/app/onboarding/page.tsx:8`："告诉 GrowthPilot 你想先推进什么，我们会先给你一版柔和、可执行、中文优先的行动拆解。"
- **优化方案**：改为"描述你的目标，GrowthPilot 将生成一份可执行的行动计划"。

### 2.9 GoalForm 文案

- **现状**：
  - `src/components/goals/goal-form.tsx:87`："这 14 天最想推进的目标"
  - `src/components/goals/goal-form.tsx:139-141`："GrowthPilot 会怎么帮你？先给你一版中文目标拆解，再按你的基础与可投入时长做轻量个性化调整。"
  - `src/components/goals/goal-form.tsx:150`："生成我的成长计划"
- **优化方案**：
  - 标题改为"你的目标"
  - 帮-tip 文案改为"根据你的基础和可投入时长，生成可执行的行动拆解"
  - 按钮文案保留或改为"开始规划"

### 2.10 GoalDetailPage 和 offline view 文案

- **现状**：
  - `src/app/goals/[goalId]/page.tsx:57`："别急着一次性做完，先把下一步压缩到身体愿意配合开始的尺度。"——过于口语化
  - `src/app/goals/[goalId]/page.tsx:64`："保留中文提示和阶段节奏，方便你后面直接拿来展示产品思路。"——无意义填充文案
  - `src/components/goals/goal-detail-offline-view.tsx:48-49`：两段 fallback description 包含开发者调试信息
- **优化方案**：
  - 删除"保留中文提示…"这种无意义描述
  - 将"压缩到身体愿意配合开始的尺度"改为"拆解为可立即执行的小步骤"
  - 简化 fallback description 为"当前使用离线数据展示"

### 2.11 GoalTimeline 文案

- **现状**：`src/components/goals/goal-timeline.tsx:48-49`："先顺着正在推进的那条线，稳稳把目标往前挪"、"不用一次性做完全部动作，先让下一小步变得更容易开始。"
- **优化方案**：改为更简洁的标题如"目标阶段拆解"，描述改为"按阶段逐步推进目标"。

### 2.12 Profile 页面文案

- **现状**：`src/app/profile/page.tsx:19`："把你的行动风格、节奏偏好和最近亮点整理成一页可讲故事的成长快照。"
- **优化方案**：改为"汇总你的目标、节奏和行动记录"。

### 2.13 ProfileSummary 文案

- **现状**：多处口语化文案：
  - `src/components/profile/profile-summary.tsx:53`："只要继续保住一个小步启动，你的节奏感就会越来越稳。"
  - `src/components/profile/profile-summary.tsx:59`："把需要沉浸推进的动作尽量放到这个时间窗里，启动阻力会更低。"
- **优化方案**：精简为更客观克制的表述，如"保持每日行动节奏"、"建议在该时段安排需要专注的任务"。

---

## 三、逻辑跳转与流程梳理

### 3.1 "继续今日行动"跳转到兜底页面

- **现状**：`src/app/goals/[goalId]/page.tsx:78-80` 及 `src/components/goals/goal-detail-offline-view.tsx:80-82` 均有"继续今日行动"按钮，链接到 `/focus`。但 `/focus` 页面（`src/app/focus/page.tsx`）在无数据库连接且无 localStorage 缓存时，会渲染 `FocusOfflineView`，展示硬编码的示例任务"完成 20 分钟简历优化"，对用户无意义。
- **优化方案**：
  1. `FocusOfflineView` 无缓存时展示"请先创建目标并生成计划"的引导提示，并提供跳转回 `/onboarding` 的链接，而非展示虚假的示例任务。
  2. `/focus` 在无可用任务时给用户明确反馈，而非展示硬编码假数据。
  3. 目标详情页"继续今日行动"按钮考虑根据当前任务状态调整文案或可见性。
- **涉及文件**：
  - `src/components/focus/focus-offline-view.tsx`
  - `src/app/focus/page.tsx`
  - `src/components/goals/goal-detail-offline-view.tsx`
  - `src/app/goals/[goalId]/page.tsx`
- **预期效果**：消除用户从目标详情页点击"继续今日行动"进入无意义兜底页面的困惑。

### 3.2 Profile 页面跳转到"本周复盘"

- **现状**：`src/components/profile/profile-summary.tsx:44` 有"查看本周复盘"链接。
- **优化方案**：随"本周复盘"功能移除，一并移除该链接。（见第七节）

### 3.3 Dashboard InsightPanel 跳转到"本周复盘"

- **现状**：`src/components/dashboard/insight-panel.tsx:23-25` 有"查看本周复盘"链接。
- **优化方案**：随"本周复盘"功能移除，一并移除该链接，可替换为"查看目标详情"链接以保持面板实用性。（见第七节和第七章创意建议）

---

## 四、大模型提示词与生成策略优化

### 4.1 Goal Planner 提示词过于死板

- **现状**：`src/lib/ai/goal-planner.ts:105-117` 中，prompt 硬性要求"恰好 3 个阶段里程碑和恰好 3 个关键动作"，且 `normalizeGoalPlan` 函数（同文件 :36-70）不仅截断多余项，还在不足 3 个时直接回退到 fallback。这导致生成结果永远只有 3 里程碑 + 3 任务，与规则模板几乎无差异。`temperature: 0` 更加剧了单一生成问题。
- **优化方案**：
  1. 将里程碑数量范围放宽为 2-4 个，关键动作范围放宽为 3-6 个，不再强制"恰好"。
  2. prompt 中增加更多上下文引导（用户的当前基础、每日可用时长、最大阻碍），鼓励模型根据输入灵活调整拆解粒度。
  3. `normalizeGoalPlan` 中放宽校验逻辑：允许 2-4 个里程碑、3-6 个任务通过，不再因数量不等于 3 而直接回退。
  4. `temperature` 从 0 提升到 0.4，让生成结果有一定变化性。
- **涉及文件**：`src/lib/ai/goal-planner.ts`
- **预期效果**：生成的计划不再千篇一律，能真正反映用户输入的个性化差异。

### 4.2 Review Generator 提示词优化

- **现状**：`src/lib/ai/review-generator.ts:83-89` system prompt 使用英文"Act as an empathetic Growth Coach for a Chinese college student..."，与全站中文优先定位不一致；且输出格式只要求 `summary` 和 `advice` 两个字段，内容单调。`temperature: 0` 导致每次生成高度一致。
- **优化方案**：
  1. 将 system prompt 改为中文，风格与产品一致。
  2. 增加 `highlights` 字段的生成引导，让模型输出更具参考价值的要点。
  3. 将 `temperature` 提升到 0.4。
  4. 鼓励模型根据实际数据给出不同视角的建议，而非每次都输出相似的"拆小任务、20分钟起步"。
- **涉及文件**：`src/lib/ai/review-generator.ts`
- **预期效果**：复盘内容更丰富、更有差异化。

### 4.3 规则模板 (`rules.ts`) 内容单一

- **现状**：`src/lib/ai/rules.ts:32-67` 中 `buildWeeklyReviewFallback` 函数的 `advice` 始终是拆分任务+20分钟的固定模板，`summary` 也是固定句式。
- **优化方案**：在 advice 模板中增加更多条件分支：
  - 基于 `topDelayReason` 分类给不同建议模板
  - 基于 `completionRate` 区间给不同鼓励语
  - 基于 `dominantMoodLabel` 给对应的行动建议
  让规则模板本身也更灵活。
- **涉及文件**：`src/lib/ai/rules.ts`
- **预期效果**：即使无 LLM 可用时，规则回退内容也有一定变化。

---

## 五、去除"本周复盘"功能

### 5.1 需要移除的入口与组件

| 文件 | 位置 | 改动 |
|---|---|---|
| `src/components/marketing/hero.tsx` | `:16-18` | 删除"查看成长趋势"按钮（链接到 `/review`） |
| `src/components/layout/site-shell.tsx` | `:15` navItems | 删除 `{ href: "/review", label: "本周复盘" }` |
| `src/components/dashboard/insight-panel.tsx` | `:21-27` | 删除"查看本周复盘"链接及容器 div |
| `src/components/profile/profile-summary.tsx` | `:43-45` | 删除"查看本周复盘"链接 |
| `src/components/review/review-summary.tsx` | 整个文件 | 删除 |
| `src/app/review/page.tsx` | 整个文件 | 删除 |

### 5.2 可保留但暂不暴露的部分

以下后端逻辑保留（以备后续恢复复盘功能时复用），但前端入口全部移除：

- `src/lib/ai/review-generator.ts` — 保留，但不再有前端页面调用
- `src/lib/ai/rules.ts` 中的 `buildWeeklyReviewFallback` — 保留
- `src/lib/db/queries/reviews.ts` — 保留（数据库层不变）
- `src/app/api/reviews/generate/route.ts` — 保留为 API 端点，但无前端触发

### 5.3 预期效果

用户流程简化为："创建目标 → 查看驾驶舱 → 执行今日行动 → 查看目标详情 → 个人档案"。

---

## 六、UI 展示杂乱问题

### 6.1 InsightPanel 内容为静态硬编码

- **现状**：`src/components/dashboard/insight-panel.tsx` 的所有数据（最稳时段、建议策略）都是硬编码占位值，不接收任何动态参数。
- **优化方案**：将其改为接收 `preferredWindow` 和 `advice` 等参数，从 Dashboard 页面传入实际数据；同时在无数据时展示更通用、不虚假的信息（如"完成更多任务后，这里将展示你的专注时段和建议"）。

### 6.2 Dashboard offline view 技术描述暴露

- **现状**：`src/components/dashboard/dashboard-offline-view.tsx:58-60` 中 `planCopy` 会展示"系统已从本次生成结果中读取阶段与任务（本地预览：未连接数据库时由此缓存驱动展示）。"这类给开发者看的信息。
- **优化方案**：将所有 fallback 场景的描述统一为用户可理解的简洁文案，如"当前展示上次生成的计划"。
- **预期效果**：用户不再看到技术调试信息。

### 6.3 Profile 页面 fallback 文案

- **现状**：`src/app/profile/page.tsx:19`："把你的行动风格、节奏偏好和最近亮点整理成一页可讲故事的成长快照。"——口语化且冗长。
- **优化方案**：改为"汇总你的目标、节奏和行动记录"。

---

## 七、创意性优化建议

### 7.1 目标详情页增加进度可视化

- **现状**：`src/app/goals/[goalId]/page.tsx` 和 `src/components/goals/goal-detail-offline-view.tsx` 仅以文字"已完成 X / Y 个关键动作"表示进度。
- **优化方案**：增加一个简单的进度条（纯 CSS 实现即可），让用户直观感受到完成进度。数据 (`completedTaskCount / totalTaskCount`) 已经存在于 view model 中，可直接使用。
- **涉及文件**：`src/app/goals/[goalId]/page.tsx`、`src/components/goals/goal-detail-offline-view.tsx`、`src/styles/globals.css`

### 7.2 Focus 页完成后的正向反馈增强

- **现状**：`src/components/focus/focus-session-card.tsx:171-179` 完成后仅展示"已完成，继续保持"的禁用按钮和一句文案，用户完成后无路可走。
- **优化方案**：完成后增加"返回驾驶舱"（`/dashboard`）和"查看目标详情"的跳转引导，让用户完成行动后不会卡在当前页面。
- **涉及文件**：`src/components/focus/focus-session-card.tsx`

### 7.3 InsightPanel 底部链接替代

- **现状**：移除复盘入口后，InsightPanel 底部将无跳转链接。
- **优化方案**：将 InsightPanel 底部链接改为"查看目标详情"（指向当前目标的详情页），与 Dashboard 主卡片形成互补，让用户从 InsightPanel 也能直达目标拆解页。
- **涉及文件**：`src/components/dashboard/insight-panel.tsx`

---

## 八、安全性与可维护性

### 8.1 API 端点缺少访问控制

- **现状**：所有 API 端点 (`/api/goals`, `/api/tasks/[taskId]`, `/api/reviews/generate`) 均无任何认证机制，任何匿名请求都能创建目标和更新任务。
- **优化方案**：这是 MVP 阶段，暂不引入完整认证体系，但应在 Cloudflare 层面配置基本的 rate limiting，防止滥用。后续版本再接入 Cloudflare Access 或自建认证。
- **最低限度**：在 Cloudflare Dashboard 中为 Worker 配置 rate limiting 规则。

### 8.2 硬编码的用户 ID

- **现状**：多处使用 `"growthpilot-demo-user"` 作为硬编码 `userId`（`src/lib/db/mappers.ts:24`、`src/app/api/tasks/[taskId]/route.ts:53`、`src/app/api/reviews/generate/route.ts:48`）。
- **优化方案**：集中定义为一个常量 `DEFAULT_USER_ID`（如放置在 `src/lib/constants.ts`），在代码注释中明确标注这是 MVP 阶段的临时方案，后续需替换为真实用户认证。
- **预期效果**：提高可维护性，避免硬编码字符串散落各处。

### 8.3 LLM API Key 安全

- **现状**：`src/lib/ai/llm-config.ts` 和 `src/lib/ai/resolve-ai-options.ts` 从环境变量读取 API key，通过 Authorization header 传递给 LLM API。这部分安全模型依赖 Cloudflare Workers 的 secret 管理，是合理的。
- **注意**：确保 `.env.local` 始终在 `.gitignore` 中（当前已有），不要将 API key 提交到仓库。

---

## 九、实施优先级

| 优先级 | 编号 | 改动项 | 涉及文件 |
|---|---|---|---|
| P0 | 1.1 | 移除首页"查看成长趋势"按钮 | `hero.tsx` |
| P0 | 5.1 | 移除"本周复盘"全部入口和组件 | `site-shell.tsx`, `hero.tsx`, `insight-panel.tsx`, `profile-summary.tsx`, `review-summary.tsx`(删文件), `app/review/page.tsx`(删文件) |
| P0 | 2.3 | 移除"生成方式：大模型个性化"开发者提示 | `dashboard/page.tsx`, `dashboard-offline-view.tsx` |
| P0 | 3.1 | 修复"继续今日行动"进入无意义兜底页面 | `focus-offline-view.tsx`, `focus/page.tsx` |
| P1 | 2.x | 全站文案精简专业化 | 所有页面和组件文件 |
| P1 | 4.x | 大模型提示词与生成策略优化 | `goal-planner.ts`, `review-generator.ts`, `rules.ts` |
| P1 | 6.1 | InsightPanel 动态化或添加空状态提示 | `insight-panel.tsx` |
| P1 | 6.2 | Dashboard offline view 技术描述清理 | `dashboard-offline-view.tsx` |
| P2 | 7.1 | 目标详情页进度可视化 | 目标详情页及相关 CSS |
| P2 | 7.2 | Focus 完成后跳转引导 | `focus-session-card.tsx` |
| P2 | 7.3 | InsightPanel 底部链接替代 | `insight-panel.tsx` |
| P2 | 8.2 | 硬编码 userId 常量化 | `mappers.ts`, `tasks route`, `reviews route`, 新建 `constants.ts` |

---

## 附录：改动的约束检查清单

- [ ] 大模型调用链路（`goal-planner.ts` → `/api/goals` → `generatePersonalizedGoalPlan`）在优化后仍完整可用
- [ ] LLM 回退逻辑（`config` 为 null 时回退到 `fallback`）未被破坏
- [ ] 所有 API endpoint（`/api/goals`, `/api/tasks/[taskId]`, `/api/reviews/generate`）仍可正常请求和响应
- [ ] 数据库 schema 和 migration 不受影响
- [ ] 删除 `review` 页面和组件后，不会产生悬空 import 或死链
- [ ] 导航栏移除"本周复盘"后，所有页面跳转仍然完整
- [ ] `next build` 和 `npm run test:unit` / `npm run test:component` 在改动后通过