import Link from "next/link";

type InsightPanelProps = {
  preferredWindow?: string | null;
  advice?: string | null;
  goalDetailHref?: string;
};

export function InsightPanel({ preferredWindow, advice, goalDetailHref }: InsightPanelProps) {
  const windowLabel = preferredWindow?.trim() || null;
  const adviceText = advice?.trim() || null;

  const summary =
    adviceText ||
    (windowLabel
      ? `当前记录中的偏好专注时段为 ${windowLabel}。`
      : "完成更多任务后，这里将结合你的记录展示专注时段与推进建议。");

  const strategyCard =
    adviceText != null
      ? "按上方建议微调本周节奏"
      : windowLabel != null
        ? "将该时段用于最难启动的任务"
        : "逐步完成今日安排的动作";

  return (
    <section className="shell-panel shell-panel-soft">
      <p className="section-chip">本周推进建议</p>
      <h2 className="panel-title">专注节奏与下一步</h2>
      <p className="panel-copy">{summary}</p>
      <div className="insight-stack">
        <article className="mini-card">
          <span className="mini-label">较稳时段</span>
          <strong>{windowLabel ?? "待积累"}</strong>
        </article>
        <article className="mini-card">
          <span className="mini-label">建议策略</span>
          <strong>{strategyCard}</strong>
        </article>
      </div>

      {goalDetailHref ? (
        <div className="profile-action-row">
          <Link href={goalDetailHref} className="secondary-link">
            查看目标详情
          </Link>
        </div>
      ) : null}
    </section>
  );
}
