import { describe, expect, it } from "vitest";

import { buildGoalGraph } from "@/lib/db/mappers";

describe("buildGoalGraph", () => {
  it("creates database-ready goal, milestone, and task records", () => {
    const result = buildGoalGraph(
      {
        title: "做出两个能投产品经理暑期实习的项目",
        category: "job",
        deadline: "2026-04-30",
        currentLevel: "starter",
        dailyMinutes: 90,
        mainBlocker: "不知道每天先做什么",
      },
      {
        now: new Date("2026-04-09T00:00:00.000Z"),
        userId: "user-demo-1",
      },
    );

    expect(result.goal.userId).toBe("user-demo-1");
    expect(result.milestones).toHaveLength(3);
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0]?.status).toBe("doing");
    expect(result.tasks.every((task) => task.goalId === result.goal.id)).toBe(true);
    expect(result.tasks[0]?.plannedDate).toBe("2026-04-09");
    expect(JSON.parse(result.goal.profileSnapshot).mainBlocker).toBe("不知道每天先做什么");
  });
});
