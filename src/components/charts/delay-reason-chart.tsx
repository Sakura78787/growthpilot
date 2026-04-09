"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DelayReasonChartProps = {
  data: Array<{ reason: string; count: number }>;
};

export function DelayReasonChart({ data }: DelayReasonChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="shell-panel shell-panel-soft chart-card">
      <p className="section-chip">拖延原因分布</p>
      <div className="chart-frame">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <XAxis dataKey="reason" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d8c38f" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-placeholder">图表将在浏览器中加载</div>
        )}
      </div>
    </section>
  );
}
