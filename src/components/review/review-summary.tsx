import Link from "next/link";

type ReviewSummaryProps = {
  summary: string;
  advice: string;
  highlights?: string[];
};

export function ReviewSummary({ summary, advice, highlights = [] }: ReviewSummaryProps) {
  return (
    <section className="review-grid">
      <article className="shell-panel shell-panel-strong">
        <p className="section-chip">本周复盘</p>
        <p className="panel-copy">{summary}</p>
      </article>

      <article className="shell-panel shell-panel-soft">
        <p className="section-chip">下周建议</p>
        <p className="panel-copy">{advice}</p>
      </article>

      {highlights.length > 0 ? (
        <div className="review-highlight-grid">
          {highlights.map((item) => (
            <article key={item} className="mini-card">
              <span className="mini-label">复盘线索</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      ) : null}

      <div className="review-action-row">
        <Link href="/dashboard" className="secondary-link">
          回到成长驾驶舱
        </Link>
        <Link href="/profile" className="secondary-link">
          打开成长档案
        </Link>
      </div>
    </section>
  );
}
