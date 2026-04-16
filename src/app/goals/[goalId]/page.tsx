import { GoalDetailOfflineView } from "@/components/goals/goal-detail-offline-view";
import Link from "next/link";

import { GoalTimeline } from "@/components/goals/goal-timeline";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildFallbackGoalDetail, buildGoalDetailViewModel, getGoalDetail } from "@/lib/db/queries/goals";
import { normalizeGoalCategory } from "@/lib/goal-category";
import { buildGoalPlan } from "@/lib/mock/seed-data";

const defaultGoalTitle = "做出两个能投产品经理暑期实习的项目";

type SearchParamValue = string | string[] | undefined;

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ goalId: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const [{ goalId }, query] = await Promise.all([params, searchParams]);
  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;
  const detail = db
    ? await runWithOptionalDbFallback(() => getGoalDetail(db, goalId), null)
    : null;

  const fallbackGoalTitle = pickFirst(query.title) ?? defaultGoalTitle;
  const fallbackGoalCategory = normalizeGoalCategory(pickFirst(query.category));

  if (!detail?.goal) {
    return (
      <GoalDetailOfflineView
        goalId={goalId}
        fallbackTitle={fallbackGoalTitle}
        fallbackCategory={fallbackGoalCategory}
      />
    );
  }

  const detailView = buildGoalDetailViewModel(detail);
  const description = "查看目标的阶段拆解与任务进度。";
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
