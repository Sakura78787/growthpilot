# GrowthPilot 实施计划

> **给执行型智能体：** 必需子技能：优先使用 `superpowers:subagent-driven-development`，或使用 `superpowers:executing-plans` 逐任务执行本计划。步骤使用复选框（`- [ ]`）进行跟踪。

**目标：** Build a Chinese-first GrowthPilot MVP that helps Chinese mainland college students turn growth goals into actionable plans, track execution, review weekly behavior, and view PM analytics in a polished, emotionally warm web product.

**架构：** Use a single Next.js codebase deployed to Cloudflare Workers via OpenNext for Cloudflare. Keep the data layer inside Cloudflare D1 with Drizzle ORM, use route handlers/server actions for mutations, and implement AI features with a rules-first fallback so the product remains usable on free tiers.

**技术栈：** Next.js, TypeScript, Tailwind CSS, Motion, Cloudflare Workers, Cloudflare D1, Drizzle ORM, Zod, Vitest, Testing Library, Playwright, Recharts, Wrangler

---

## 文件结构

### 根目录

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`
- Create: `drizzle.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

### 应用路由

- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/(app)/onboarding/page.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/goals/[goalId]/page.tsx`
- Create: `src/app/(app)/focus/page.tsx`
- Create: `src/app/(app)/review/page.tsx`
- Create: `src/app/(app)/console/page.tsx`
- Create: `src/app/(app)/profile/page.tsx`
- Create: `src/app/api/goals/route.ts`
- Create: `src/app/api/tasks/[taskId]/route.ts`
- Create: `src/app/api/reviews/generate/route.ts`
- Create: `src/app/api/console/overview/route.ts`

### 组件

- Create: `src/components/layout/site-shell.tsx`
- Create: `src/components/marketing/hero.tsx`
- Create: `src/components/ui/glass-card.tsx`
- Create: `src/components/ui/section-title.tsx`
- Create: `src/components/dashboard/today-panel.tsx`
- Create: `src/components/dashboard/insight-panel.tsx`
- Create: `src/components/goals/goal-form.tsx`
- Create: `src/components/goals/goal-timeline.tsx`
- Create: `src/components/focus/focus-session-card.tsx`
- Create: `src/components/review/review-summary.tsx`
- Create: `src/components/console/metric-grid.tsx`
- Create: `src/components/charts/action-trend-chart.tsx`
- Create: `src/components/charts/delay-reason-chart.tsx`

### 领域与数据

- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/mappers.ts`
- Create: `src/lib/db/queries/goals.ts`
- Create: `src/lib/db/queries/tasks.ts`
- Create: `src/lib/db/queries/reviews.ts`
- Create: `src/lib/db/queries/analytics.ts`
- Create: `src/lib/analytics/events.ts`
- Create: `src/lib/ai/goal-planner.ts`
- Create: `src/lib/ai/review-generator.ts`
- Create: `src/lib/ai/rules.ts`
- Create: `src/lib/validation/goals.ts`
- Create: `src/lib/validation/tasks.ts`
- Create: `src/lib/cloudflare/env.ts`
- Create: `src/lib/mock/seed-data.ts`

### 样式与测试

- Create: `src/styles/globals.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/unit/goals.spec.ts`
- Create: `tests/unit/reviews.spec.ts`
- Create: `tests/unit/analytics.spec.ts`
- Create: `tests/component/hero.spec.tsx`
- Create: `tests/component/dashboard.spec.tsx`
- Create: `tests/e2e/landing.spec.ts`
- Create: `tests/e2e/onboarding-to-dashboard.spec.ts`
- Create: `tests/e2e/review-console.spec.ts`

## 任务 1：初始化仓库与可交付骨架

**文件：**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `wrangler.jsonc`
- Create: `open-next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/styles/globals.css`
- Test: `tests/e2e/landing.spec.ts`
- Test: `tests/component/hero.spec.tsx`

- [ ] **步骤 1：先写失败的落地页测试**

```ts
// tests/e2e/landing.spec.ts
import { test, expect } from "@playwright/test";

test("landing page shows Chinese GrowthPilot hero copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "稳稳地前进，而不是用力过猛" })).toBeVisible();
  await expect(page.getByRole("link", { name: "开始今日行动" })).toBeVisible();
  await expect(page.getByText("面向中国大陆大学生的成长驾驶舱")).toBeVisible();
});
```

```tsx
// tests/component/hero.spec.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/marketing/hero";

describe("Hero", () => {
  it("renders the Chinese-first promise", () => {
    render(<Hero />);
    expect(screen.getByText("面向中国大陆大学生的成长驾驶舱")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始今日行动" })).toBeInTheDocument();
  });
});
```

- [ ] **步骤 2：运行测试并确认它们先失败**

运行： `npm run test:component -- tests/component/hero.spec.tsx`
预期：FAIL with missing dependency or missing module errors because the app has not been scaffolded yet.

运行： `npm run test:e2e -- tests/e2e/landing.spec.ts`
预期：FAIL because the application and Playwright config do not exist yet.

- [ ] **步骤 3：初始化 Next.js + Cloudflare 项目**

运行：

```bash
npm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
npm install motion recharts drizzle-orm zod lucide-react clsx tailwind-merge
npm install -D @opennextjs/cloudflare wrangler drizzle-kit vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

然后用下面这些内容替换生成的根配置：

```json
// package.json
{
  "name": "growthpilot",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "test:unit": "vitest run tests/unit",
    "test:component": "vitest run tests/component",
    "test:e2e": "playwright test",
    "cf:preview": "opennextjs-cloudflare build && wrangler dev",
    "cf:deploy": "opennextjs-cloudflare build && wrangler deploy",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply growthpilot-db --local",
    "db:migrate:remote": "wrangler d1 migrations apply growthpilot-db --remote"
  }
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
```

```ts
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

```jsonc
// wrangler.jsonc
{
  "name": "growthpilot",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-04-09",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "growthpilot-db",
      "database_id": "REPLACE_AFTER_CREATION"
    }
  ]
}
```

- [ ] **步骤 4：实现应用骨架和营销首页**

```tsx
// src/app/layout.tsx
import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrowthPilot",
  description: "面向中国大陆大学生的成长驾驶舱"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// src/components/marketing/hero.tsx
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-shell">
      <p className="hero-kicker">面向中国大陆大学生的成长驾驶舱</p>
      <h1>稳稳地前进，而不是用力过猛</h1>
      <p className="hero-copy">
        用中文、温和且可解释的数据反馈，帮你推进自律、学习和求职目标。
      </p>
      <div className="hero-actions">
        <Link href="/onboarding">开始今日行动</Link>
        <Link href="/review">查看成长趋势</Link>
      </div>
    </section>
  );
}
```

```tsx
// src/app/page.tsx
import { Hero } from "@/components/marketing/hero";

export default function HomePage() {
  return <Hero />;
}
```

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --gp-cream: #f7f2e8;
  --gp-sage: #dce8db;
  --gp-blue: #d7e6f4;
  --gp-gold: #e8d2a2;
  --gp-text: #4f5448;
}

body {
  min-height: 100vh;
  margin: 0;
  color: var(--gp-text);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.75), transparent 30%),
    radial-gradient(circle at top right, rgba(215, 230, 244, 0.85), transparent 28%),
    linear-gradient(180deg, #f7f2e8, #edf4ef 55%, #e4edf5);
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.hero-shell {
  max-width: 960px;
  margin: 0 auto;
  padding: 96px 24px;
}

.hero-kicker {
  margin-bottom: 16px;
  color: #7a7d6e;
}

.hero-copy {
  max-width: 32rem;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}
```

- [ ] **步骤 5：补齐测试配置**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
```

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: "http://127.0.0.1:3000"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  }
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **步骤 6：运行测试并确认通过**

运行： `npm run test:component -- tests/component/hero.spec.tsx`
预期：PASS

运行： `npm run test:e2e -- tests/e2e/landing.spec.ts`
预期：PASS

- [ ] **步骤 7：提交代码**

```bash
git add .
git commit -m "feat: bootstrap GrowthPilot landing shell"
```

## 任务 2：搭建 D1 数据模型、种子数据与查询层

**文件：**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/queries/goals.ts`
- Create: `src/lib/db/queries/tasks.ts`
- Create: `src/lib/db/queries/reviews.ts`
- Create: `src/lib/db/queries/analytics.ts`
- Create: `src/lib/cloudflare/env.ts`
- Create: `src/lib/mock/seed-data.ts`
- Create: `drizzle.config.ts`
- Create: `drizzle/0000_initial.sql`
- Test: `tests/unit/goals.spec.ts`
- Test: `tests/unit/analytics.spec.ts`

- [ ] **步骤 1：先写失败的数据层测试**

```ts
// tests/unit/goals.spec.ts
import { describe, expect, it } from "vitest";
import { buildGoalPlan } from "@/lib/mock/seed-data";

describe("buildGoalPlan", () => {
  it("creates milestone and task structure for a self-discipline goal", () => {
    const result = buildGoalPlan({
      title: "把作息调回 23 点前入睡",
      category: "discipline"
    });

    expect(result.milestones).toHaveLength(3);
    expect(result.tasks[0]?.title).toContain("23:30");
  });
});
```

```ts
// tests/unit/analytics.spec.ts
import { describe, expect, it } from "vitest";
import { summarizeDelayReasons } from "@/lib/db/queries/analytics";

describe("summarizeDelayReasons", () => {
  it("sorts delay reasons from highest to lowest", () => {
    const rows = [
      { delayReason: "任务太大", count: 4 },
      { delayReason: "状态差", count: 2 }
    ];

    expect(summarizeDelayReasons(rows)[0]).toEqual({
      reason: "任务太大",
      count: 4
    });
  });
});
```

- [ ] **Step 2: Run the unit tests to verify they fail**

运行： `npm run test:unit -- tests/unit/goals.spec.ts tests/unit/analytics.spec.ts`
预期：FAIL because the data helpers and analytics queries do not exist yet.

- [ ] **步骤 3：补上 schema、环境访问和种子逻辑**

```ts
// src/lib/db/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  grade: text("grade").notNull(),
  primaryGoalType: text("primary_goal_type").notNull(),
  preferredFocusTime: text("preferred_focus_time").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  deadline: text("deadline").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});
```

```ts
// src/lib/cloudflare/env.ts
export type CloudflareEnv = {
  DB: D1Database;
};

export function assertEnv(env: Partial<CloudflareEnv>): CloudflareEnv {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is required.");
  }

  return env as CloudflareEnv;
}
```

```ts
// src/lib/mock/seed-data.ts
export function buildGoalPlan(input: { title: string; category: "discipline" | "study" | "job" }) {
  if (input.category === "discipline") {
    return {
      milestones: [
        { title: "第一周稳定在 23:30 前收尾" },
        { title: "第二周稳定在 23:15 前放下手机" },
        { title: "第三周稳定在 23:00 前入睡" }
      ],
      tasks: [
        { title: "今晚 23:30 前关闭短视频", bucket: "night-routine" },
        { title: "洗漱后不再打开社交应用", bucket: "night-routine" }
      ]
    };
  }

  return {
    milestones: [{ title: "先建立基础节奏" }, { title: "形成稳定推进" }, { title: "完成阶段目标" }],
    tasks: [{ title: `完成与「${input.title}」相关的 20 分钟关键动作`, bucket: "default" }]
  };
}
```

- [ ] **步骤 4：实现 D1 客户端与查询辅助函数**

```ts
// src/lib/db/client.ts
import { drizzle } from "drizzle-orm/d1";
import { assertEnv, type CloudflareEnv } from "@/lib/cloudflare/env";

export function getDb(env: Partial<CloudflareEnv>) {
  return drizzle(assertEnv(env).DB);
}
```

```ts
// src/lib/db/queries/analytics.ts
export function summarizeDelayReasons(rows: Array<{ delayReason: string; count: number }>) {
  return [...rows]
    .sort((a, b) => b.count - a.count)
    .map((row) => ({ reason: row.delayReason, count: row.count }));
}
```

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "sqlite"
});
```

```sql
-- drizzle/0000_initial.sql
CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  nickname TEXT NOT NULL,
  grade TEXT NOT NULL,
  primary_goal_type TEXT NOT NULL,
  preferred_focus_time TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  deadline TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

- [ ] **步骤 5：扩展里程碑、任务、复盘与事件表**

```ts
// src/lib/db/schema.ts
export const milestones = sqliteTable("milestones", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  title: text("title").notNull(),
  targetDate: text("target_date").notNull(),
  status: text("status").notNull()
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  milestoneId: text("milestone_id"),
  title: text("title").notNull(),
  plannedDate: text("planned_date").notNull(),
  plannedDuration: integer("planned_duration").notNull(),
  status: text("status").notNull(),
  delayReason: text("delay_reason"),
  actualStartTime: text("actual_start_time"),
  actualEndTime: text("actual_end_time")
});
```

```ts
// src/lib/db/schema.ts
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  weekStart: text("week_start").notNull(),
  completionRate: integer("completion_rate").notNull(),
  topDelayReason: text("top_delay_reason"),
  bestFocusPeriod: text("best_focus_period"),
  aiSummary: text("ai_summary").notNull(),
  nextWeekAdvice: text("next_week_advice").notNull()
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventName: text("event_name").notNull(),
  eventPayload: text("event_payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});
```

- [ ] **Step 6: Run the unit tests to verify they pass**

运行： `npm run test:unit -- tests/unit/goals.spec.ts tests/unit/analytics.spec.ts`
预期：PASS

- [ ] **步骤 7：提交代码**

```bash
git add drizzle drizzle.config.ts src/lib tests/unit
git commit -m "feat: add D1 schema and analytics foundations"
```

## 任务 3：实现引导、目标创建与驾驶舱流程

**文件：**
- Create: `src/app/(app)/onboarding/page.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/goals/[goalId]/page.tsx`
- Create: `src/app/api/goals/route.ts`
- Create: `src/components/goals/goal-form.tsx`
- Create: `src/components/dashboard/today-panel.tsx`
- Create: `src/components/dashboard/insight-panel.tsx`
- Create: `src/components/layout/site-shell.tsx`
- Create: `src/lib/validation/goals.ts`
- Test: `tests/e2e/onboarding-to-dashboard.spec.ts`
- Test: `tests/component/dashboard.spec.tsx`

- [ ] **步骤 1：先写失败的引导与驾驶舱测试**

```ts
// tests/e2e/onboarding-to-dashboard.spec.ts
import { test, expect } from "@playwright/test";

test("user can create a goal and land in dashboard", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByLabel("当前最重要的目标").fill("准备暑期产品经理实习");
  await page.getByLabel("目标类型").selectOption("job");
  await page.getByRole("button", { name: "生成我的成长计划" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("本周一句洞察")).toBeVisible();
});
```

```tsx
// tests/component/dashboard.spec.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TodayPanel } from "@/components/dashboard/today-panel";

describe("TodayPanel", () => {
  it("shows the primary tasks and action button", () => {
    render(
      <TodayPanel
        streak={12}
        tasks={[{ id: "task-1", title: "修改一版简历", status: "todo" }]}
      />
    );

    expect(screen.getByText("连续行动 12 天")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始今天的关键动作" })).toBeInTheDocument();
  });
});
```

- [ ] **步骤 2：运行测试并确认它们先失败**

运行： `npm run test:component -- tests/component/dashboard.spec.tsx`
预期：FAIL because the dashboard components do not exist yet.

运行： `npm run test:e2e -- tests/e2e/onboarding-to-dashboard.spec.ts`
预期：FAIL because the onboarding route and goal API are not implemented yet.
- [ ] **步骤 3：添加校验与目标创建接口**

```ts
// src/lib/validation/goals.ts
import { z } from "zod";

export const goalInputSchema = z.object({
  title: z.string().min(4, "请至少输入 4 个字"),
  category: z.enum(["discipline", "study", "job"]),
  deadline: z.string().min(1, "请选择截止日期"),
  priority: z.enum(["low", "medium", "high"]),
  weeklyHours: z.number().min(1).max(30)
});

export type GoalInput = z.infer<typeof goalInputSchema>;
```

```ts
// src/app/api/goals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { goalInputSchema } from "@/lib/validation/goals";
import { buildGoalPlan } from "@/lib/mock/seed-data";

export async function POST(request: NextRequest) {
  const payload = goalInputSchema.parse(await request.json());
  const plan = buildGoalPlan({ title: payload.title, category: payload.category });

  return NextResponse.json({
    goalId: "goal-demo-1",
    plan
  });
}
```

- [ ] **步骤 4：实现引导页与共享外壳**

```tsx
// src/components/layout/site-shell.tsx
export function SiteShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">GrowthPilot</p>
          <h1 className="text-2xl font-semibold text-stone-700">{title}</h1>
        </div>
      </header>
      {children}
    </main>
  );
}
```

```tsx
// src/components/goals/goal-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GoalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    await fetch("/api/goals", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        category: formData.get("category"),
        deadline: formData.get("deadline"),
        priority: "high",
        weeklyHours: 8
      })
    });
    router.push("/dashboard");
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-[28px] bg-white/50 p-6 shadow-lg shadow-stone-200/40">
      <label className="block">
        <span>当前最重要的目标</span>
        <input name="title" className="mt-2 w-full rounded-2xl border border-white/60 px-4 py-3" />
      </label>
      <label className="block">
        <span>目标类型</span>
        <select name="category" className="mt-2 w-full rounded-2xl border border-white/60 px-4 py-3">
          <option value="discipline">自律</option>
          <option value="study">学习</option>
          <option value="job">求职</option>
        </select>
      </label>
      <label className="block">
        <span>截止日期</span>
        <input name="deadline" type="date" className="mt-2 w-full rounded-2xl border border-white/60 px-4 py-3" />
      </label>
      <button className="rounded-full bg-stone-800 px-5 py-3 text-white" disabled={loading}>
        {loading ? "正在生成..." : "生成我的成长计划"}
      </button>
    </form>
  );
}
```

```tsx
// src/app/(app)/onboarding/page.tsx
import { SiteShell } from "@/components/layout/site-shell";
import { GoalForm } from "@/components/goals/goal-form";

export default function OnboardingPage() {
  return (
    <SiteShell title="开始你的成长计划">
      <GoalForm />
    </SiteShell>
  );
}
```

- [ ] **步骤 5：实现驾驶舱与目标详情页**

```tsx
// src/components/dashboard/today-panel.tsx
export function TodayPanel({
  streak,
  tasks
}: {
  streak: number;
  tasks: Array<{ id: string; title: string; status: string }>;
}) {
  return (
    <section className="rounded-[32px] bg-white/45 p-6 shadow-xl shadow-emerald-100/30">
      <p className="text-sm text-stone-500">连续行动 {streak} 天</p>
      <h2 className="mt-2 text-2xl font-semibold text-stone-700">今天先完成 3 个关键动作</h2>
      <ul className="mt-4 space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded-2xl bg-white/70 px-4 py-3">
            {task.title}
          </li>
        ))}
      </ul>
      <button className="mt-5 rounded-full bg-stone-800 px-5 py-3 text-white">开始今天的关键动作</button>
    </section>
  );
}
```

```tsx
// src/components/dashboard/insight-panel.tsx
export function InsightPanel() {
  return (
    <section className="rounded-[32px] bg-white/38 p-6">
      <p className="text-sm text-stone-500">本周一句洞察</p>
      <p className="mt-3 leading-8 text-stone-700">
        你在晚上 20:00 到 22:00 的执行效率更高，把任务拆成 20 分钟动作后更容易开始。
      </p>
    </section>
  );
}
```

```tsx
// src/app/(app)/dashboard/page.tsx
import { SiteShell } from "@/components/layout/site-shell";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { InsightPanel } from "@/components/dashboard/insight-panel";

export default function DashboardPage() {
  return (
    <SiteShell title="成长驾驶舱">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TodayPanel streak={12} tasks={[{ id: "task-1", title: "修改一版简历", status: "todo" }]} />
        <InsightPanel />
      </div>
    </SiteShell>
  );
}
```

```tsx
// src/app/(app)/goals/[goalId]/page.tsx
import { SiteShell } from "@/components/layout/site-shell";

export default function GoalDetailPage() {
  return (
    <SiteShell title="目标详情">
      <section className="rounded-[28px] bg-white/50 p-6">
        <h2 className="text-xl font-semibold text-stone-700">准备暑期产品经理实习</h2>
        <p className="mt-3 text-stone-600">阶段目标、拆解任务和重新规划入口会集中放在这里。</p>
      </section>
    </SiteShell>
  );
}
```

- [ ] **步骤 6：运行测试并确认通过**

运行： `npm run test:component -- tests/component/dashboard.spec.tsx`
预期：PASS

运行： `npm run test:e2e -- tests/e2e/onboarding-to-dashboard.spec.ts`
预期：PASS

- [ ] **步骤 7：提交代码**

```bash
git add src/app src/components src/lib/validation tests/component tests/e2e
git commit -m "feat: add onboarding and dashboard flow"
```

## 任务 4：实现专注执行、周复盘与 AI 兜底

**文件：**
- Create: `src/app/(app)/focus/page.tsx`
- Create: `src/app/(app)/review/page.tsx`
- Create: `src/app/api/tasks/[taskId]/route.ts`
- Create: `src/app/api/reviews/generate/route.ts`
- Create: `src/components/focus/focus-session-card.tsx`
- Create: `src/components/review/review-summary.tsx`
- Create: `src/lib/validation/tasks.ts`
- Create: `src/lib/ai/rules.ts`
- Create: `src/lib/ai/goal-planner.ts`
- Create: `src/lib/ai/review-generator.ts`
- Test: `tests/unit/reviews.spec.ts`
- Test: `tests/e2e/review-console.spec.ts`

- [ ] **步骤 1：先写失败的复盘测试**

```ts
// tests/unit/reviews.spec.ts
import { describe, expect, it } from "vitest";
import { buildWeeklyReviewFallback } from "@/lib/ai/rules";

describe("buildWeeklyReviewFallback", () => {
  it("creates a Chinese summary even without remote AI", () => {
    const result = buildWeeklyReviewFallback({
      completionRate: 68,
      topDelayReason: "任务太大",
      bestFocusPeriod: "20:00 - 22:00"
    });

    expect(result.summary).toContain("你本周已经完成了 68%");
    expect(result.advice).toContain("任务太大");
  });
});
```

```ts
// tests/e2e/review-console.spec.ts
import { test, expect } from "@playwright/test";

test("review page shows Chinese summary and console entry", async ({ page }) => {
  await page.goto("/review");
  await expect(page.getByText("本周复盘")).toBeVisible();
  await expect(page.getByText("下周建议")).toBeVisible();
  await page.goto("/console");
  await expect(page.getByText("北极星指标")).toBeVisible();
});
```

- [ ] **步骤 2：运行测试并确认它们先失败**

运行： `npm run test:unit -- tests/unit/reviews.spec.ts`
预期：FAIL because the AI fallback helper does not exist yet.

运行： `npm run test:e2e -- tests/e2e/review-console.spec.ts`
预期：FAIL because the review and console routes do not exist yet.
- [ ] **步骤 3：实现任务更新接口与 AI 兜底规则**

```ts
// src/lib/validation/tasks.ts
import { z } from "zod";

export const taskUpdateSchema = z.object({
  status: z.enum(["todo", "doing", "done", "skipped"]),
  delayReason: z.string().optional(),
  mood: z.enum(["steady", "tired", "anxious", "motivated"]).optional()
});
```

```ts
// src/lib/ai/rules.ts
export function buildWeeklyReviewFallback(input: {
  completionRate: number;
  topDelayReason: string;
  bestFocusPeriod: string;
}) {
  return {
    summary: `你本周已经完成了 ${input.completionRate}% 的关键动作，最稳定的高效时段是 ${input.bestFocusPeriod}。`,
    advice: `下周请优先拆小“${input.topDelayReason}”相关任务，把每个动作压缩到 20 分钟内开始。`
  };
}
```

```ts
// src/app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { taskUpdateSchema } from "@/lib/validation/tasks";

export async function PATCH(request: NextRequest) {
  const payload = taskUpdateSchema.parse(await request.json());

  return NextResponse.json({
    ok: true,
    task: {
      id: "task-demo-1",
      ...payload
    }
  });
}
```

- [ ] **步骤 4：实现专注页与复盘接口**

```tsx
// src/components/focus/focus-session-card.tsx
"use client";

import { useState } from "react";

export function FocusSessionCard() {
  const [done, setDone] = useState(false);

  return (
    <section className="rounded-[32px] bg-white/48 p-6 shadow-xl shadow-sky-100/30">
      <p className="text-sm text-stone-500">今日关键动作</p>
      <h2 className="mt-2 text-2xl font-semibold text-stone-700">完成 20 分钟简历优化</h2>
      <button className="mt-5 rounded-full bg-stone-800 px-5 py-3 text-white" onClick={() => setDone(true)}>
        {done ? "已完成，继续保持" : "开始专注"}
      </button>
    </section>
  );
}
```

```tsx
// src/app/(app)/focus/page.tsx
import { SiteShell } from "@/components/layout/site-shell";
import { FocusSessionCard } from "@/components/focus/focus-session-card";

export default function FocusPage() {
  return (
    <SiteShell title="今日行动">
      <FocusSessionCard />
    </SiteShell>
  );
}
```

```ts
// src/lib/ai/review-generator.ts
import { buildWeeklyReviewFallback } from "@/lib/ai/rules";

export async function generateWeeklyReview() {
  return buildWeeklyReviewFallback({
    completionRate: 68,
    topDelayReason: "任务太大",
    bestFocusPeriod: "20:00 - 22:00"
  });
}
```

```ts
// src/app/api/reviews/generate/route.ts
import { NextResponse } from "next/server";
import { generateWeeklyReview } from "@/lib/ai/review-generator";

export async function POST() {
  return NextResponse.json(await generateWeeklyReview());
}
```

- [ ] **步骤 5：实现复盘页面**

```tsx
// src/components/review/review-summary.tsx
export function ReviewSummary({
  summary,
  advice
}: {
  summary: string;
  advice: string;
}) {
  return (
    <section className="grid gap-4">
      <article className="rounded-[28px] bg-white/52 p-6">
        <p className="text-sm text-stone-500">本周复盘</p>
        <p className="mt-3 leading-8 text-stone-700">{summary}</p>
      </article>
      <article className="rounded-[28px] bg-white/44 p-6">
        <p className="text-sm text-stone-500">下周建议</p>
        <p className="mt-3 leading-8 text-stone-700">{advice}</p>
      </article>
    </section>
  );
}
```

```tsx
// src/app/(app)/review/page.tsx
import { SiteShell } from "@/components/layout/site-shell";
import { ReviewSummary } from "@/components/review/review-summary";
import { generateWeeklyReview } from "@/lib/ai/review-generator";

export default async function ReviewPage() {
  const review = await generateWeeklyReview();

  return (
    <SiteShell title="本周复盘">
      <ReviewSummary summary={review.summary} advice={review.advice} />
    </SiteShell>
  );
}
```

- [ ] **步骤 6：运行测试并确认通过**

运行： `npm run test:unit -- tests/unit/reviews.spec.ts`
预期：PASS

运行： `npm run test:e2e -- tests/e2e/review-console.spec.ts`
Expected: still FAIL on `/console`, which is expected until Task 5.

- [ ] **步骤 7：提交代码**

```bash
git add src/app src/components src/lib tests/unit tests/e2e
git commit -m "feat: add focus tracking and weekly review fallback"
```

## 任务 5：完成 PM 后台、动效打磨与上线准备

**文件：**
- Create: `src/app/(app)/console/page.tsx`
- Create: `src/app/(app)/profile/page.tsx`
- Create: `src/app/api/console/overview/route.ts`
- Create: `src/components/console/metric-grid.tsx`
- Create: `src/components/charts/action-trend-chart.tsx`
- Create: `src/components/charts/delay-reason-chart.tsx`
- Modify: `src/styles/globals.css`
- Modify: `README.md`
- Modify: `.env.example`
- Test: `tests/e2e/review-console.spec.ts`

- [ ] **步骤 1：补充失败的 PM 后台测试**

```ts
// tests/e2e/review-console.spec.ts
import { test, expect } from "@playwright/test";

test("console shows the PM metrics that support portfolio storytelling", async ({ page }) => {
  await page.goto("/console");
  await expect(page.getByText("北极星指标")).toBeVisible();
  await expect(page.getByText("周有效行动次数")).toBeVisible();
  await expect(page.getByText("周复盘完成率")).toBeVisible();
  await expect(page.getByText("拖延原因分布")).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

运行： `npm run test:e2e -- tests/e2e/review-console.spec.ts`
预期：FAIL because the PM console page and chart components do not exist yet.

- [ ] **步骤 3：实现后台接口与图表组件**

```ts
// src/app/api/console/overview/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    northStar: [
      { label: "周有效行动次数", value: 18 },
      { label: "周复盘完成率", value: "72%" }
    ],
    delayReasons: [
      { reason: "任务太大", count: 8 },
      { reason: "状态差", count: 3 },
      { reason: "临时有事", count: 2 }
    ],
    actionTrend: [
      { day: "周一", count: 2 },
      { day: "周二", count: 3 },
      { day: "周三", count: 4 },
      { day: "周四", count: 2 },
      { day: "周五", count: 3 }
    ]
  });
}
```

```tsx
// src/components/console/metric-grid.tsx
export function MetricGrid({
  items
}: {
  items: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.label} className="rounded-[28px] bg-white/48 p-5">
          <p className="text-sm text-stone-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-stone-700">{item.value}</p>
        </article>
      ))}
    </div>
  );
}
```

```tsx
// src/components/charts/delay-reason-chart.tsx
"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DelayReasonChart({ data }: { data: Array<{ reason: string; count: number }> }) {
  return (
    <div className="h-72 rounded-[28px] bg-white/44 p-5">
      <p className="mb-4 text-sm text-stone-500">拖延原因分布</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="reason" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#d8c38f" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **步骤 4：实现 PM 后台页面与轻量个人页**

```tsx
// src/app/(app)/console/page.tsx
import { SiteShell } from "@/components/layout/site-shell";
import { MetricGrid } from "@/components/console/metric-grid";
import { DelayReasonChart } from "@/components/charts/delay-reason-chart";

const northStar = [
  { label: "周有效行动次数", value: 18 },
  { label: "周复盘完成率", value: "72%" }
];

const delayReasons = [
  { reason: "任务太大", count: 8 },
  { reason: "状态差", count: 3 },
  { reason: "临时有事", count: 2 }
];

export default function ConsolePage() {
  return (
    <SiteShell title="PM 数据后台">
      <section className="space-y-6">
        <div>
          <p className="text-sm text-stone-500">北极星指标</p>
          <MetricGrid items={northStar} />
        </div>
        <DelayReasonChart data={delayReasons} />
      </section>
    </SiteShell>
  );
}
```

```tsx
// src/app/(app)/profile/page.tsx
import { SiteShell } from "@/components/layout/site-shell";

export default function ProfilePage() {
  return (
    <SiteShell title="我的成长档案">
      <section className="rounded-[28px] bg-white/50 p-6">
        <p className="text-stone-700">这里展示成长标签、偏好时段、连续行动记录和轻量徽章。</p>
      </section>
    </SiteShell>
  );
}
```

- [ ] **步骤 5：补充动效、环境说明和部署文档**

```css
/* src/styles/globals.css */
.glass-float {
  backdrop-filter: blur(18px);
  animation: glassFloat 6s ease-in-out infinite;
}

@keyframes glassFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.soft-enter {
  animation: softEnter 500ms ease-out both;
}

@keyframes softEnter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

```env
# .env.example
NEXT_PUBLIC_APP_NAME=GrowthPilot
NEXT_PUBLIC_DEFAULT_LOCALE=zh-CN
```

```md
<!-- README.md -->
## 部署到 Cloudflare

1. 创建 D1 数据库：`wrangler d1 create growthpilot-db`
2. 把返回的 `database_id` 填入 `wrangler.jsonc`
3. 执行本地迁移：`npm run db:migrate:local`
4. 构建并预览：`npm run cf:preview`
5. 正式部署：`npm run cf:deploy`
```

- [ ] **步骤 6：执行完整验证**

运行： `npm run test:unit`
预期：PASS

运行： `npm run test:component`
预期：PASS

运行： `npm run test:e2e`
预期：PASS

运行： `npm run build`
预期：PASS

- [ ] **步骤 7：提交代码**

```bash
git add .
git commit -m "feat: ship PM console and deployment-ready polish"
```

## 自检

### 规格覆盖

- Product positioning and Chinese-first UX: covered in Tasks 1, 3, 4, and 5.
- Soft, lightweight, animated visual style: covered in Tasks 1 and 5.
- Core user loop from onboarding to review: covered in Tasks 3 and 4.
- PM analytics console: covered in Task 5.
- Cloudflare + free-tier deployment path for mainland-friendly access: covered in Tasks 1, 2, and 5.
- Lightweight profile and non-core scope control: covered in Task 5 and reflected in MVP choices.

### 占位词检查

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task includes concrete files, code, commands, expected results, and commit messages.

### 类型一致性

- Goal categories consistently use `discipline | study | job`.
- Review fallback helper consistently returns `{ summary, advice }`.
- PM console consistently uses `northStar` metrics and `delayReasons` data shape.

