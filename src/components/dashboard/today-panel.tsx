import Link from "next/link";

export function TodayPanel({
  streak,
  tasks,
  preferredWindow,
  focusGoalId,
}: {
  streak: number;
  tasks: Array<{ id: string; title: string; status: "todo" | "doing" | "done" | "skipped" }>;
  /** 有数据时展示偏好时段；无则通用文案 */
  preferredWindow?: string | null;
  /** 传给 /focus?goalId=，便于离线或与当前主目标对齐 */
  focusGoalId?: string;
}) {
  const statusLabel = {
    todo: "待开始",
    doing: "正在推进",
    done: "已完成",
    skipped: "已跳过",
  } as const;

  const n = tasks.length;
  const windowLabel = preferredWindow?.trim();
  const taskMeta = windowLabel
    ? `适合在 ${windowLabel} 推进`
    : "按自身节奏推进";

  const focusHref =
    focusGoalId && focusGoalId.trim().length > 0
      ? `/focus?goalId=${encodeURIComponent(focusGoalId.trim())}`
      : "/focus";

  return (
    <section className="shell-panel shell-panel-strong">
      <p className="section-chip">连续行动 {streak} 天</p>
      <h2 className="panel-title">
        今天先完成 {n} 个关键动作
      </h2>
      <p className="panel-copy">逐步完成今日安排的动作。</p>

      <ul className="task-list" aria-label="今日任务">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            <div>
              <p className="task-title">{task.title}</p>
              <p className="task-meta">{taskMeta}</p>
            </div>
            <span className="task-status">{statusLabel[task.status]}</span>
          </li>
        ))}
      </ul>

      <Link href={focusHref} className="primary-button">
        开始今天的关键动作
      </Link>
    </section>
  );
}
