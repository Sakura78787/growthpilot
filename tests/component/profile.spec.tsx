import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileSummary } from "@/components/profile/profile-summary";

describe("ProfileSummary", () => {
  it("renders a Chinese growth snapshot with quick navigation links", () => {
    render(
      <ProfileSummary
        headline="做出两个能投产品经理暑期实习的项目"
        badges={["求职推进型", "连续行动中", "会复盘"]}
        streakLabel="连续行动 3 天"
        preferredWindowLabel="20:00 - 22:00"
        recentHighlight="已完成 2 个关键动作，1 个正在推进。"
        nextAdvice="下周继续把任务压到 20 分钟内开始。"
        recentMoments={["最近完成：优化项目首页叙事", "当前推进：补一张流程图"]}
      />,
    );

    expect(screen.getByText("做出两个能投产品经理暑期实习的项目")).toBeInTheDocument();
    expect(screen.getByText("求职推进型")).toBeInTheDocument();
    expect(screen.getByText("连续行动 3 天")).toBeInTheDocument();
    expect(screen.getByText("20:00 - 22:00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "回到驾驶舱" })).toHaveAttribute("href", "/dashboard");
  });
});
