"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GoalTimeline } from "@/components/goals/goal-timeline";
import { SiteShell } from "@/components/layout/site-shell";
import {
  readLastGoalId,
  readOfflineGoalPlan,
  type OfflineGoalPlanPayload,
} from "@/lib/client/offline-goal-plan";
import { buildFallbackGoalDetail, buildGoalDetailViewModel } from "@/lib/db/queries/goals";
import { buildGoalPlan, type GoalCategory } from "@/lib/mock/seed-data";

type Props = {
  goalId: string;
  fallbackTitle: string;
  fallbackCategory: GoalCategory;
};

export function GoalDetailOfflineView({ goalId, fallbackTitle, fallbackCategory }: Props) {
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

  const detailView = useMemo(() => {
    const plan = stored?.planSeed ?? buildGoalPlan({ title: fallbackTitle, category: fallbackCategory });
    return buildGoalDetailViewModel(
      buildFallbackGoalDetail({
        goalId,
        title: fallbackTitle,
        category: fallbackCategory,
        plan,
      }),
    );
  }, [goalId, fallbackTitle, fallbackCategory, stored]);

  const description = "当前使用离线数据展示。";
  const progressPct =
    detailView.totalTaskCount > 0
      ? Math.round((detailView.completedTaskCount / detailView.totalTaskCount) * 100)
      : 0;

  return (
    <SiteShell title="目标详情" description={description}>
      <section className="goal-detail-grid">
        <article className="shell-panel shell-panel-strong">
          <p className="section-chip">目标卡片</p>
          <h2 className="panel-title">{detailView.goalTitle}</h2>
          <p className="panel-copy">
            这是一个「{detailView.categoryLabel}」方向目标，将关键动作拆解为可立即执行的小步骤。
          </p>

          <div
            className="goal-progress-bar-wrap"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label="关键动作完成进度"
          >
            <div className="goal-progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="goal-progress-text">{detailView.progressLabel}</p>

          <div className="goal-stats-grid">
            <article className="mini-card">
              <span className="mini-label">当前目标类型</span>
              <strong>{detailView.categoryLabel}</strong>
              <p>可在下方查看各阶段与关键动作的状态。</p>
            </article>

            <article className="mini-card">
              <span className="mini-label">拆解规模</span>
              <strong>{detailView.milestones.length} 个阶段</strong>
              <p>{detailView.totalTaskCount} 个关键动作已经排好基本顺序。</p>
            </article>
          </div>

          <div className="detail-banner">
            <Link href={`/dashboard?goalId=${detailView.goalId}`} className="secondary-link">
              返回成长驾驶舱
            </Link>
            <Link href={`/focus?goalId=${encodeURIComponent(detailView.goalId)}`} className="primary-button">
              继续今日行动
            </Link>
          </div>
        </article>
      </section>

      <GoalTimeline
        goalId={detailView.goalId}
        progressLabel={detailView.progressLabel}
        nextActionTitle={detailView.nextAction?.title ?? "选择一个 20 分钟内的动作开始"}
        nextActionMeta={detailView.nextAction?.meta ?? "先开始第一步"}
        milestones={detailView.milestones}
        looseTasks={detailView.looseTasks}
      />
    </SiteShell>
  );
}
