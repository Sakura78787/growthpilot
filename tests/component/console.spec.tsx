import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActionTrendChart } from "@/components/charts/action-trend-chart";
import { DelayReasonChart } from "@/components/charts/delay-reason-chart";
import { ConversionFunnel } from "@/components/console/conversion-funnel";
import { MetricGrid } from "@/components/console/metric-grid";
import { SegmentCards } from "@/components/console/segment-cards";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="chart-shell">{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: () => <div data-testid="bar-series" />,
  Area: () => <div data-testid="area-series" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

describe("MetricGrid", () => {
  it("renders PM metrics and session-signal labels", () => {
    render(
      <>
        <MetricGrid
          items={[
            { label: "周有效行动次数", value: 18 },
            { label: "周复盘完成率", value: "72%" },
          ]}
        />
        <MetricGrid
          eyebrow="执行感受"
          items={[
            { label: "主导状态", value: "很有干劲" },
            { label: "平均精力", value: "4/5" },
          ]}
        />
      </>,
    );

    expect(screen.getByText("周有效行动次数")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getAllByText("执行感受")).toHaveLength(2);
    expect(screen.getByText("很有干劲")).toBeInTheDocument();
  });
});

describe("Console storytelling blocks", () => {
  it("renders funnel and segment modules in Chinese", () => {
    render(
      <>
        <ConversionFunnel
          items={[
            { label: "创建目标", value: 12 },
            { label: "开始行动", value: 8 },
            { label: "完成动作", value: 6 },
            { label: "生成复盘", value: 4 },
          ]}
        />
        <SegmentCards
          items={[
            {
              label: "求职冲刺型",
              value: 6,
              note: "围绕作品集、简历和投递持续推进",
            },
          ]}
        />
      </>,
    );

    expect(screen.getByText("闭环漏斗")).toBeInTheDocument();
    expect(screen.getByText("创建目标")).toBeInTheDocument();
    expect(screen.getByText("用户分群")).toBeInTheDocument();
    expect(screen.getByText("求职冲刺型")).toBeInTheDocument();
    expect(screen.getByText("围绕作品集、简历和投递持续推进")).toBeInTheDocument();
  });
});

describe("Console charts", () => {
  it("renders the Chinese chart titles", () => {
    render(
      <>
        <DelayReasonChart data={[{ reason: "任务太大", count: 8 }]} />
        <ActionTrendChart data={[{ day: "周一", count: 2 }]} />
      </>,
    );

    expect(screen.getByText("拖延原因分布")).toBeInTheDocument();
    expect(screen.getByText("行动趋势")).toBeInTheDocument();
    expect(screen.getAllByTestId("chart-shell")).toHaveLength(2);
  });
});
