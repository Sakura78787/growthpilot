import Link from "next/link";

export function InsightPanel() {
  return (
    <section className="shell-panel shell-panel-soft">
      <p className="section-chip">本周一句洞察</p>
      <h2 className="panel-title">你不是做不到，只是需要更轻的起步动作</h2>
      <p className="panel-copy">
        你在晚上 20:00 到 22:00 的执行效率更高。把任务拆成 20 分钟动作后，真正开始的概率会明显提升。
      </p>
      <div className="insight-stack">
        <article className="mini-card">
          <span className="mini-label">最稳时段</span>
          <strong>20:00 - 22:00</strong>
        </article>
        <article className="mini-card">
          <span className="mini-label">建议策略</span>
          <strong>先做能在 20 分钟内起步的一件事</strong>
        </article>
      </div>

      <div className="profile-action-row">
        <Link href="/review" className="secondary-link">
          查看本周复盘
        </Link>
      </div>
    </section>
  );
}
