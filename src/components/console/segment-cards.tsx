type SegmentCardsProps = {
  items: Array<{ label: string; value: number; note: string }>;
};

export function SegmentCards({ items }: SegmentCardsProps) {
  return (
    <section className="shell-panel shell-panel-soft">
      <p className="section-chip">用户分群</p>
      <div className="segment-grid">
        {items.map((item) => (
          <article key={item.label} className="mini-card mini-card-tall">
            <span className="mini-label">细分人群</span>
            <strong>{item.label}</strong>
            <p>{item.note}</p>
            <p className="segment-value">当前样本 {item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
