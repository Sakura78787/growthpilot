import { DashboardOfflineView } from "@/components/dashboard/dashboard-offline-view";
import { normalizeGoalCategory } from "@/lib/goal-category";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildDashboardViewModel, getGoalDetail, getLatestGoalDetail } from "@/lib/db/queries/goals";
import { getProfileViewFromDb } from "@/lib/db/queries/profile";

export const dynamic = "force-dynamic";

const defaultGoalTitle = "做出两个能投产品经理暑期实习的项目";

type SearchParamValue = string | string[] | undefined;

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const params = await searchParams;
  const requestedGoalId = pickFirst(params.goalId);
  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;
  const dbDetail = db
    ? await runWithOptionalDbFallback(
        () => (requestedGoalId ? getGoalDetail(db, requestedGoalId) : getLatestGoalDetail(db)),
        null,
      )
    : null;

  if (dbDetail?.goal && db) {
    const view = buildDashboardViewModel({
      goal: dbDetail.goal,
      tasks: dbDetail.tasks,
    });
    const detailHref = `/goals/${view.goalId}`;
    const insight = await runWithOptionalDbFallback(() => getProfileViewFromDb(db), null);

    return (
      <SiteShell
        title="成长驾驶舱"
        description="将目标拆解为今日可执行的具体动作。"
      >
        <div className="dashboard-grid">
          <TodayPanel streak={Math.max(1, view.tasks.filter((task) => task.status !== "todo").length)} tasks={view.tasks} />
          <InsightPanel
            preferredWindow={insight?.preferredWindowLabel}
            advice={insight?.nextAdvice}
            goalDetailHref={detailHref}
          />
        </div>

        <section className="shell-panel shell-panel-soft">
          <div className="detail-banner">
            <div>
              <p className="section-chip">当前主目标</p>
              <h2 className="panel-title">{view.goalTitle}</h2>
              <p className="panel-copy">
                你当前选择的是「{view.goalCategoryLabel}」类型目标，以下为该目标下的阶段任务与推进状态。
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

  const goalId = requestedGoalId ?? "goal-demo-1";
  const goalTitle = pickFirst(params.goalTitle) ?? defaultGoalTitle;
  const goalCategory = normalizeGoalCategory(pickFirst(params.goalCategory));

  return (
    <DashboardOfflineView
      goalId={goalId}
      goalTitle={goalTitle}
      goalCategory={goalCategory}
    />
  );
}
