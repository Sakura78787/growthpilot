import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InsightPanel } from "@/components/dashboard/insight-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { GoalForm } from "@/components/goals/goal-form";

describe("GoalForm", () => {
  it("renders onboarding fields including v2 personalization inputs", () => {
    render(<GoalForm />);

    expect(screen.getByLabelText("这 14 天最想推进的目标")).toBeInTheDocument();
    expect(screen.getByLabelText("目标类型")).toBeInTheDocument();
    expect(screen.getByLabelText("截止日期")).toBeInTheDocument();
    expect(screen.getByLabelText("当前基础")).toBeInTheDocument();
    expect(screen.getByLabelText("每天可投入时长（分钟）")).toBeInTheDocument();
    expect(screen.getByLabelText("当前最大阻碍")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成我的成长计划" })).toBeInTheDocument();
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
        />
        <InsightPanel />
      </>,
    );

    expect(screen.getByText("连续行动 12 天")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始今天的关键动作" })).toHaveAttribute("href", "/focus");
    expect(screen.getByText("本周一句洞察")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看本周复盘" })).toHaveAttribute("href", "/review");
    expect(screen.getByRole("link", { name: "去看 PM 数据后台" })).toHaveAttribute("href", "/console");
  });
});
