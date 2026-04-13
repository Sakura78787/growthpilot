"use client";

import { useEffect, useState } from "react";

import { InsightPanel } from "@/components/dashboard/insight-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { SiteShell } from "@/components/layout/site-shell";
import { readOfflineGoalPlan, type OfflineGoalPlanPayload } from "@/lib/client/offline-goal-plan";
import { buildGoalPlan, type GoalCategory } from "@/lib/mock/seed-data";

type Props = {
  goalId: string;
  goalTitle: string;
  goalCategory: GoalCategory;
  planSourceFromUrl: "llm" | "rules";
  planReasonFromUrl: string;
};

export function DashboardOfflineView({
  goalId,
  goalTitle,
  goalCategory,
  planSourceFromUrl,
  planReasonFromUrl,
}: Props) {
  // sessionStorage is only available after mount; reading it during render breaks SSR hydration.
  const [stored, setStored] = useState<OfflineGoalPlanPayload | null>(null);
  useEffect(() => {
    setStored(readOfflineGoalPlan(goalId));
  }, [goalId]);

  const plan = stored?.planSeed ?? buildGoalPlan({ title: goalTitle, category: goalCategory });
  const planSource = stored?.planSource ?? planSourceFromUrl;
  const planReason = stored?.planReason ?? planReasonFromUrl;

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
    ? "系统已从本次生成结果中读取阶段与任务（本地预览：未连接数据库时由此缓存驱动展示）。"
    : `你当前选择的是“${categoryLabel}”类型目标，系统已先用回退数据帮你拆出首批里程碑和任务。`;

  return (
    <SiteShell
      title="成长驾驶舱"
      description="把目标拆成今天就能开始的动作，同时保留一点轻盈感，让推进这件事没那么累。"
    >
      <div className="dashboard-grid">
        <TodayPanel streak={streak} tasks={tasks} />
        <InsightPanel />
      </div>

      <section className="shell-panel shell-panel-soft">
        <div className="detail-banner">
          <div>
            <p className="section-chip">当前主目标</p>
            <h2 className="panel-title">{goalTitle}</h2>
            <p className="panel-copy">{planCopy}</p>
            <p className="panel-copy">
              生成方式：{planSource === "llm" ? "大模型个性化" : "规则模板"}。{planReason}
            </p>
          </div>
          <a href={detailHref} className="secondary-link">
            查看完整目标拆解
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
