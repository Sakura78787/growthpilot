"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ActionTrendChartProps = {
  data: Array<{ day: string; count: number }>;
};

export function ActionTrendChart({ data }: ActionTrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="shell-panel shell-panel-soft chart-card">
      <p className="section-chip">行动趋势</p>
      <div className="chart-frame">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(116, 120, 102, 0.14)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#c6ab6c"
                fill="rgba(232, 210, 162, 0.42)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">图表将在浏览器中加载</div>
        )}
      </div>
    </section>
  );
}
