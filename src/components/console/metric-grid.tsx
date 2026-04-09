type MetricGridProps = {
  items: Array<{ label: string; value: string | number }>;
  eyebrow?: string;
};

export function MetricGrid({ items, eyebrow = "北极星指标" }: MetricGridProps) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <article key={item.label} className="mini-card metric-card">
          <span className="mini-label">{eyebrow}</span>
          <strong>{item.value}</strong>
          <p>{item.label}</p>
        </article>
      ))}
    </div>
  );
}
