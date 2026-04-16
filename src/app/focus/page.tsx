import { FocusOfflineView } from "@/components/focus/focus-offline-view";
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
        <FocusOfflineView />
      )}
    </SiteShell>
  );
}
