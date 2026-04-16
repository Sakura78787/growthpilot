import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GoalTimeline } from "@/components/goals/goal-timeline";

describe("GoalTimeline", () => {
  it("renders the milestone timeline, progress summary, and next action CTA", () => {
    render(
      <GoalTimeline
        goalId="goal-test-1"
        progressLabel="已完成 1 / 3 个关键动作"
        nextActionTitle="补一张流程图"
        nextActionMeta="预计 20 分钟 · 正在推进"
        milestones={[
          {
            id: "milestone-1",
            title: "先补齐作品集与简历底稿",
            targetDateLabel: "4 月 12 日前",
            statusLabel: "当前推进中",
            tasks: [
              {
                id: "task-1",
                title: "优化一段项目描述",
                meta: "预计 25 分钟 · 已完成",
                statusLabel: "已经完成",
              },
              {
                id: "task-2",
                title: "补一张流程图",
                meta: "预计 20 分钟 · 正在推进",
                statusLabel: "正在推进",
                note: "卡点：任务太大",
              },
            ],
          },
          {
            id: "milestone-2",
            title: "形成每周可展示的项目输出",
            targetDateLabel: "4 月 19 日前",
            statusLabel: "接下来推进",
            tasks: [
              {
                id: "task-3",
                title: "写一页数据复盘",
                meta: "预计 20 分钟 · 尚未开始",
                statusLabel: "尚未开始",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText("目标阶段拆解")).toBeInTheDocument();
    expect(screen.getByText("已完成 1 / 3 个关键动作")).toBeInTheDocument();
    expect(screen.getByText("先补齐作品集与简历底稿")).toBeInTheDocument();
    expect(screen.getAllByText("补一张流程图")).toHaveLength(2);
    expect(screen.getByText("卡点：任务太大")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "去今日行动页" })).toHaveAttribute(
      "href",
      "/focus?goalId=goal-test-1",
    );
  });
});
