import Link from "next/link";

type ProfileSummaryProps = {
  headline: string;
  badges: string[];
  streakLabel: string;
  preferredWindowLabel: string;
  recentHighlight: string;
  nextAdvice: string;
  recentMoments: string[];
};

export function ProfileSummary({
  headline,
  badges,
  streakLabel,
  preferredWindowLabel,
  recentHighlight,
  nextAdvice,
  recentMoments,
}: ProfileSummaryProps) {
  return (
    <section className="profile-stack">
      <article className="shell-panel shell-panel-strong profile-hero">
        <div className="profile-badge-row">
          {badges.map((badge) => (
            <span key={badge} className="section-chip">
              {badge}
            </span>
          ))}
        </div>

        <h2 className="panel-title">{headline}</h2>
        <p className="panel-copy">{recentHighlight}</p>

        <div className="profile-action-row">
          <Link href="/dashboard" className="secondary-link">
            回到成长驾驶舱
          </Link>
          <Link href="/focus" className="primary-button">
            继续今日行动
          </Link>
          <Link href="/review" className="secondary-link">
            查看本周复盘
          </Link>
        </div>
      </article>

      <div className="profile-grid">
        <article className="shell-panel shell-panel-soft">
          <p className="section-chip">行动节奏</p>
          <h3 className="task-title">{streakLabel}</h3>
          <p className="panel-copy">只要继续保住一个小步启动，你的节奏感就会越来越稳。</p>
        </article>

        <article className="shell-panel shell-panel-soft">
          <p className="section-chip">偏好时段</p>
          <h3 className="task-title">{preferredWindowLabel}</h3>
          <p className="panel-copy">把需要沉浸推进的动作尽量放到这个时间窗里，启动阻力会更低。</p>
        </article>

        <article className="shell-panel shell-panel-soft">
          <p className="section-chip">下一步建议</p>
          <p className="panel-copy">{nextAdvice}</p>
        </article>

        <article className="shell-panel shell-panel-soft">
          <p className="section-chip">最近推进</p>
          <ul className="profile-moment-list">
            {recentMoments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
