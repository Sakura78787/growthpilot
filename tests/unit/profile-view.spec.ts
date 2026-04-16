import { describe, expect, it } from "vitest";

import { buildProfileViewFromRecords } from "@/lib/db/queries/profile";

describe("buildProfileViewFromRecords", () => {
  it("builds a Chinese growth snapshot from goals, tasks, logs, and reviews", () => {
    const result = buildProfileViewFromRecords({
      goals: [
        { title: "做出两个能投产品经理暑期实习的项目", category: "job" },
        { title: "稳定晚间学习节奏", category: "study" },
      ],
      tasks: [
        { title: "优化项目首页叙事", status: "done", plannedDate: "2026-04-07", actualStartTime: "2026-04-07T12:10:00.000Z" },
        { title: "补一张流程图", status: "doing", plannedDate: "2026-04-08", actualStartTime: "2026-04-08T12:30:00.000Z" },
        { title: "写一页数据复盘", status: "done", plannedDate: "2026-04-09", actualStartTime: "2026-04-09T13:10:00.000Z" },
        { title: "整理一轮投递清单", status: "todo", plannedDate: "2026-04-10", actualStartTime: null },
      ],
      taskLogs: [
        { mood: "motivated", energyLevel: 4, loggedAt: "2026-04-07T12:10:00.000Z", delayReason: null },
        { mood: "steady", energyLevel: 3, loggedAt: "2026-04-08T12:30:00.000Z", delayReason: "任务太大" },
        { mood: "motivated", energyLevel: 5, loggedAt: "2026-04-09T13:10:00.000Z", delayReason: null },
      ],
      reviews: [
        {
          completionRate: 72,
          bestFocusPeriod: "20:00 - 22:00",
          nextWeekAdvice: "下周继续把任务压到 20 分钟内开始。",
        },
      ],
    });

    expect(result.headline).toBe("做出两个能投产品经理暑期实习的项目");
    expect(result.badges).toContain("求职推进型");
    expect(result.badges).toContain("连续行动中");
    expect(result.streakLabel).toBe("连续行动 3 天");
    expect(result.preferredWindowLabel).toBe("20:00 - 22:00");
    expect(result.nextAdvice).toBe("下周继续把任务压到 20 分钟内开始。");
    expect(result.recentHighlight).toBe("已完成 2 个关键动作，1 个正在推进。");
    expect(result.recentMoments[0]).toContain("优化项目首页叙事");
  });
});
