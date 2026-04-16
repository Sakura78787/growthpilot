import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InsightPanel } from "@/components/dashboard/insight-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { GoalForm } from "@/components/goals/goal-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("GoalForm", () => {
  it("renders onboarding fields including v2 personalization inputs", () => {
    render(<GoalForm />);

    expect(screen.getByLabelText("你的目标")).toBeInTheDocument();
    expect(screen.getByLabelText("目标类型")).toBeInTheDocument();
    expect(screen.getByLabelText("截止日期")).toBeInTheDocument();
    expect(screen.getByLabelText("当前基础")).toBeInTheDocument();
    expect(screen.getByLabelText("每天可投入时长（分钟）")).toBeInTheDocument();
    expect(screen.getByLabelText("当前最大阻碍")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始规划" })).toBeInTheDocument();
  });
});

describe("Dashboard panels", () => {
  it("renders action list, insight copy, and linked next steps", () => {
    render(
      <>
        <TodayPanel
          streak={12}
          tasks={[
            { id: "task-1", title: "修改一版简历", status: "todo" },
            { id: "task-2", title: "拆解一个作品集页面", status: "doing" },
          ]}
          preferredWindow="20:00 - 22:00"
          focusGoalId="goal-demo-1"
        />
        <InsightPanel goalDetailHref="/goals/demo" preferredWindow="20:00 - 22:00" advice="下周优先稳住启动节奏。" />
      </>,
    );

    expect(screen.getByText("连续行动 12 天")).toBeInTheDocument();
    expect(screen.getByText("今天先完成 2 个关键动作")).toBeInTheDocument();
    expect(screen.getAllByText("适合在 20:00 - 22:00 推进").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "开始今天的关键动作" })).toHaveAttribute(
      "href",
      "/focus?goalId=goal-demo-1",
    );
    expect(screen.getByText("本周推进建议")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看目标详情" })).toHaveAttribute("href", "/goals/demo");
  });
});
