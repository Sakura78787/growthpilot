import Link from "next/link";

import { GoalTimeline } from "@/components/goals/goal-timeline";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildFallbackGoalDetail, buildGoalDetailViewModel, getGoalDetail } from "@/lib/db/queries/goals";
import { buildGoalPlan, goalCategories, type GoalCategory } from "@/lib/mock/seed-data";

const defaultGoalTitle = "做出两个能投产品经理暑期实习的项目";

type SearchParamValue = string | string[] | undefined;

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCategory(value: SearchParamValue): GoalCategory {
  const category = pickFirst(value);
  return goalCategories.includes(category as GoalCategory) ? (category as GoalCategory) : "job";
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
  const fallbackGoalCategory = normalizeCategory(query.category);
  const detailView = detail?.goal
    ? buildGoalDetailViewModel(detail)
    : buildGoalDetailViewModel(
        buildFallbackGoalDetail({
          goalId,
          title: fallbackGoalTitle,
          category: fallbackGoalCategory,
          plan: buildGoalPlan({
            title: fallbackGoalTitle,
            category: fallbackGoalCategory,
          }),
        }),
      );
  const description = detail?.goal
    ? "这里优先展示已经写进数据库的阶段里程碑和任务状态，让目标不再只是一个标题。"
    : "当前还没有读到数据库记录，所以先用一版中文拆解把目标节奏、阶段和动作串起来。";

  return (
    <SiteShell title="目标详情" description={description}>
      <section className="goal-detail-grid">
        <article className="shell-panel shell-panel-strong">
          <p className="section-chip">目标卡片</p>
          <h2 className="panel-title">{detailView.goalTitle}</h2>
          <p className="panel-copy">
            这是一个“{detailView.categoryLabel}”方向目标，目前 {detailView.progressLabel}。别急着一次性做完，先把下一步压缩到身体愿意配合开始的尺度。
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
