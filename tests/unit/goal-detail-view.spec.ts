import { describe, expect, it } from "vitest";

import { buildFallbackGoalDetail, buildGoalDetailViewModel } from "@/lib/db/queries/goals";
import { buildGoalPlan } from "@/lib/mock/seed-data";

describe("buildGoalDetailViewModel", () => {
  it("groups tasks under milestones and exposes the next focus action", () => {
    const result = buildGoalDetailViewModel({
      goal: {
        id: "goal-1",
        title: "准备暑期产品经理实习",
        category: "job",
      },
      milestones: [
        {
          id: "milestone-1",
          goalId: "goal-1",
          title: "先补齐作品集与简历底稿",
          targetDate: "2026-04-12",
          status: "doing",
        },
        {
          id: "milestone-2",
          goalId: "goal-1",
          title: "形成每周可展示的项目输出",
          targetDate: "2026-04-19",
          status: "todo",
        },
      ],
      tasks: [
        {
          id: "task-1",
          goalId: "goal-1",
          milestoneId: "milestone-1",
          title: "优化一段项目描述",
          plannedDate: "2026-04-10",
          plannedDuration: 25,
          status: "done",
          delayReason: null,
          actualStartTime: null,
          actualEndTime: null,
          completionNote: "首屏信息更聚焦了",
        },
        {
          id: "task-2",
          goalId: "goal-1",
          milestoneId: "milestone-1",
          title: "补一张流程图",
          plannedDate: "2026-04-11",
          plannedDuration: 20,
          status: "doing",
          delayReason: "任务太大",
          actualStartTime: null,
          actualEndTime: null,
          completionNote: null,
        },
        {
          id: "task-3",
          goalId: "goal-1",
          milestoneId: "milestone-2",
          title: "写一页数据复盘",
          plannedDate: "2026-04-12",
          plannedDuration: 20,
          status: "todo",
          delayReason: null,
          actualStartTime: null,
          actualEndTime: null,
          completionNote: null,
        },
      ],
    });

    expect(result.categoryLabel).toBe("求职");
    expect(result.progressLabel).toBe("已完成 1 / 3 个关键动作");
    expect(result.nextAction).toEqual({
      title: "补一张流程图",
      meta: "预计 20 分钟 · 正在推进",
    });
    expect(result.milestones[0]?.statusLabel).toBe("当前推进中");
    expect(result.milestones[0]?.tasks[1]).toMatchObject({
      title: "补一张流程图",
      statusLabel: "正在推进",
      note: "卡点：任务太大",
    });
  });

  it("builds a clean fallback detail view from the seeded plan", () => {
    const result = buildGoalDetailViewModel(
      buildFallbackGoalDetail({
        goalId: "goal-demo-1",
        title: "做出两个能投产品经理暑期实习的项目",
        category: "job",
        plan: buildGoalPlan({
          title: "做出两个能投产品经理暑期实习的项目",
          category: "job",
        }),
      }),
    );

    expect(result.progressLabel).toBe("已完成 0 / 3 个关键动作");
    expect(result.milestones).toHaveLength(3);
    expect(result.nextAction).toEqual({
      title: "优化 1 段能体现产品思考的项目描述",
      meta: "预计 25 分钟 · 正在推进",
    });
  });
});
