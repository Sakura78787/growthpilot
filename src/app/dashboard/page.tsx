import { DashboardOfflineView } from "@/components/dashboard/dashboard-offline-view";
import { normalizeGoalCategory } from "@/lib/goal-category";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildDashboardViewModel, getGoalDetail, getLatestGoalDetail } from "@/lib/db/queries/goals";

export const dynamic = "force-dynamic";

const defaultGoalTitle = "做出两个能投产品经理暑期实习的项目";

type SearchParamValue = string | string[] | undefined;

function pickFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function resolvePlanBadgeFromSnapshot(value: string | null | undefined) {
  if (!value) {
    return {
      source: "rules" as const,
      reason: "当前展示的是规则模板生成的首版计划。",
    };
  }

  try {
    const parsed = JSON.parse(value) as {
      planSource?: "llm" | "rules";
      planReason?: string;
    };

    return {
      source: parsed.planSource ?? ("rules" as const),
      reason: parsed.planReason ?? "当前展示的是规则模板生成的首版计划。",
    };
  } catch {
    return {
      source: "rules" as const,
      reason: "当前展示的是规则模板生成的首版计划。",
    };
  }
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

  if (dbDetail?.goal) {
    const view = buildDashboardViewModel({
      goal: dbDetail.goal,
      tasks: dbDetail.tasks,
    });
    const detailHref = `/goals/${view.goalId}`;
    const badge = resolvePlanBadgeFromSnapshot(dbDetail.goal.profileSnapshot);

    return (
      <SiteShell
        title="成长驾驶舱"
        description="把目标拆成今天就能开始的动作，同时保留一点轻盈感，让推进这件事没那么累。"
      >
        <div className="dashboard-grid">
          <TodayPanel streak={Math.max(1, view.tasks.filter((task) => task.status !== "todo").length)} tasks={view.tasks} />
          <InsightPanel />
        </div>

        <section className="shell-panel shell-panel-soft">
          <div className="detail-banner">
            <div>
              <p className="section-chip">当前主目标</p>
              <h2 className="panel-title">{view.goalTitle}</h2>
              <p className="panel-copy">你当前选择的是“{view.goalCategoryLabel}”类型目标，系统已经优先从真实数据记录里读取你的阶段任务与推进状态。</p>
              <p className="panel-copy">
                生成方式：{badge.source === "llm" ? "大模型个性化" : "规则模板"}。{badge.reason}
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
  const planSource = pickFirst(params.planSource) === "llm" ? "llm" : "rules";
  const planReason = pickFirst(params.planReason) ?? "当前展示的是规则模板生成的首版计划。";

  return (
    <DashboardOfflineView
      goalId={goalId}
      goalTitle={goalTitle}
      goalCategory={goalCategory}
      planSourceFromUrl={planSource}
      planReasonFromUrl={planReason}
    />
  );
}
