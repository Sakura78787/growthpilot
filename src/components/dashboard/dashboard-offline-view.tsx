"use client";

import { useEffect, useState } from "react";

import { InsightPanel } from "@/components/dashboard/insight-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { SiteShell } from "@/components/layout/site-shell";
import {
  readLastGoalId,
  readOfflineGoalPlan,
  type OfflineGoalPlanPayload,
} from "@/lib/client/offline-goal-plan";
import { buildGoalPlan, type GoalCategory } from "@/lib/mock/seed-data";

type Props = {
  goalId: string;
  goalTitle: string;
  goalCategory: GoalCategory;
};

export function DashboardOfflineView({ goalId, goalTitle, goalCategory }: Props) {
  // localStorage is only available after mount; reading it during render breaks SSR hydration.
  const [stored, setStored] = useState<OfflineGoalPlanPayload | null>(null);
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

  const plan = stored?.planSeed ?? buildGoalPlan({ title: goalTitle, category: goalCategory });

  const tasks = plan.tasks.slice(0, 3).map((task, index) => ({
    id: `${goalId}-task-${index + 1}`,
    title: task.title,
    status: index === 0 ? ("doing" as const) : ("todo" as const),
  }));

  const streak = Math.max(1, tasks.filter((task) => task.status !== "todo").length);
  const categoryLabel =
    goalCategory === "discipline" ? "自律" : goalCategory === "study" ? "学习" : "求职";
  const detailHref = `/goals/${goalId}?title=${encodeURIComponent(goalTitle)}&category=${goalCategory}`;

  const planCopy = stored
    ? "当前展示上次生成的计划。"
    : `你当前选择的是「${categoryLabel}」类型目标，以下为基于回退数据拆解的首批里程碑与任务。`;

  return (
    <SiteShell
      title="成长驾驶舱"
      description="将目标拆解为今日可执行的具体动作。"
    >
      <div className="dashboard-grid">
        <TodayPanel streak={streak} tasks={tasks} />
        <InsightPanel goalDetailHref={detailHref} />
      </div>

      <section className="shell-panel shell-panel-soft">
        <div className="detail-banner">
          <div>
            <p className="section-chip">当前主目标</p>
            <h2 className="panel-title">{goalTitle}</h2>
            <p className="panel-copy">{planCopy}</p>
          </div>
          <a href={detailHref} className="secondary-link">
            查看完整目标拆解
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
