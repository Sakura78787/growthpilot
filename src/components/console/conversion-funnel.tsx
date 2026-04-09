type ConversionFunnelProps = {
  items: Array<{ label: string; value: number }>;
};

export function ConversionFunnel({ items }: ConversionFunnelProps) {
  return (
    <section className="shell-panel shell-panel-soft">
      <p className="section-chip">闭环漏斗</p>
      <div className="funnel-grid">
        {items.map((item, index) => (
          <article key={item.label} className="mini-card funnel-card">
            <span className="mini-label">阶段 {index + 1}</span>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
