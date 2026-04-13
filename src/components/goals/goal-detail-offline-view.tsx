"use client";

import Link from "next/link";
import { useMemo } from "react";

import { GoalTimeline } from "@/components/goals/goal-timeline";
import { SiteShell } from "@/components/layout/site-shell";
import { readOfflineGoalPlan } from "@/lib/client/offline-goal-plan";
import { buildFallbackGoalDetail, buildGoalDetailViewModel } from "@/lib/db/queries/goals";
import { buildGoalPlan, type GoalCategory } from "@/lib/mock/seed-data";

type Props = {
  goalId: string;
  fallbackTitle: string;
  fallbackCategory: GoalCategory;
};

export function GoalDetailOfflineView({ goalId, fallbackTitle, fallbackCategory }: Props) {
  const { detailView, hasOfflinePlan } = useMemo(() => {
    const stored = readOfflineGoalPlan(goalId);
    const plan = stored?.planSeed ?? buildGoalPlan({ title: fallbackTitle, category: fallbackCategory });
    const view = buildGoalDetailViewModel(
      buildFallbackGoalDetail({
        goalId,
        title: fallbackTitle,
        category: fallbackCategory,
        plan,
      }),
    );
    return { detailView: view, hasOfflinePlan: Boolean(stored) };
  }, [goalId, fallbackTitle, fallbackCategory]);

  const description = hasOfflinePlan
    ? "本次打开优先使用浏览器里缓存的生成结果；连接数据库后将自动切换为持久化记录。"
    : "当前还没有读到数据库记录，所以先用一版中文拆解把目标节奏、阶段和动作串起来。";

  return (
    <SiteShell title="目标详情" description={description}>
      <section className="goal-detail-grid">
        <article className="shell-panel shell-panel-strong">
          <p className="section-chip">目标卡片</p>
          <h2 className="panel-title">{detailView.goalTitle}</h2>
          <p className="panel-copy">
            这是一个“{detailView.categoryLabel}”方向目标，目前 {detailView.progressLabel}
            。别急着一次性做完，先把下一步压缩到身体愿意配合开始的尺度。
          </p>

          <div className="goal-stats-grid">
            <article className="mini-card">
              <span className="mini-label">当前目标类型</span>
              <strong>{detailView.categoryLabel}</strong>
              <p>保留中文提示和阶段节奏，方便你后面直接拿来展示产品思路。</p>
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
            <Link href="/focus" className="primary-button">
              继续今日行动
            </Link>
          </div>
        </article>
      </section>

      <GoalTimeline
        progressLabel={detailView.progressLabel}
        nextActionTitle={detailView.nextAction?.title ?? "先选一个 20 分钟以内的动作启动起来"}
        nextActionMeta={detailView.nextAction?.meta ?? "先开始，再决定要不要继续加码"}
        milestones={detailView.milestones}
        looseTasks={detailView.looseTasks}
      />
    </SiteShell>
  );
}
