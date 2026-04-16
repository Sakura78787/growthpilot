import Link from "next/link";

export function TodayPanel({
  streak,
  tasks,
}: {
  streak: number;
  tasks: Array<{ id: string; title: string; status: "todo" | "doing" | "done" | "skipped" }>;
}) {
  const statusLabel = {
    todo: "待开始",
    doing: "正在推进",
    done: "已完成",
    skipped: "已跳过",
  } as const;

  const n = tasks.length;

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
              <p className="task-meta">适合放在今晚 20:00 - 22:00 之间推进</p>
            </div>
            <span className="task-status">{statusLabel[task.status]}</span>
          </li>
        ))}
      </ul>

      <Link href="/focus" className="primary-button">
        开始今天的关键动作
      </Link>
    </section>
  );
}
