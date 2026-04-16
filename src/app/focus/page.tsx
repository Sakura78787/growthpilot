import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { getFocusTask } from "@/lib/db/queries/tasks";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;
  const focusTask = db
    ? await runWithOptionalDbFallback(() => getFocusTask(db), null)
    : null;

  return (
    <SiteShell
      title="今日行动"
      description="先从一个能开始的动作出发，把拖延压低一点，把今天的节奏轻轻拉回来。"
    >
      {focusTask ? (
        <FocusSessionCard
          taskId={focusTask.id}
          taskTitle={focusTask.title}
          plannedDuration={focusTask.plannedDuration}
        />
      ) : (
        <section className="shell-panel shell-panel-strong focus-card">
          <p className="section-chip">今日关键动作</p>
          <h2 className="panel-title">还没有正在推进的任务</h2>
          <p className="panel-copy">
            先去「开始计划」创建你的第一个目标，系统会自动帮你拆成今天能开始的小动作。
          </p>
          <a href="/onboarding" className="primary-button">
            去创建目标
          </a>
        </section>
      )}
    </SiteShell>
  );
}
