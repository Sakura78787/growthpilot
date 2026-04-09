import { describe, expect, it } from "vitest";

import { buildGoalGraph } from "@/lib/db/mappers";
import { goalRequestSchema } from "@/lib/validation/goals";

describe("goalRequestSchema v2", () => {
  it("requires personalization fields and coerces dailyMinutes", () => {
    const parsed = goalRequestSchema.parse({
      title: "做出两个能投产品经理暑期实习的项目",
      category: "job",
      deadline: "2026-04-30",
      currentLevel: "starter",
      dailyMinutes: "90",
      mainBlocker: "不知道每天先做什么",
    });

    expect(parsed.currentLevel).toBe("starter");
    expect(parsed.dailyMinutes).toBe(90);
    expect(parsed.mainBlocker).toBe("不知道每天先做什么");
  });
});

describe("buildGoalGraph v2", () => {
  it("persists profile snapshot into goal record", () => {
    const result = buildGoalGraph(
      {
        title: "做出两个能投产品经理暑期实习的项目",
        category: "job",
        deadline: "2026-04-30",
        currentLevel: "starter",
        dailyMinutes: 120,
        mainBlocker: "任务太大，不知道先做哪一步",
      },
      {
        now: new Date("2026-04-09T00:00:00.000Z"),
      },
    );

    const snapshot = JSON.parse(result.goal.profileSnapshot) as {
      currentLevel: string;
      dailyMinutes: number;
      mainBlocker: string;
    };

    expect(snapshot.currentLevel).toBe("starter");
    expect(snapshot.dailyMinutes).toBe(120);
    expect(snapshot.mainBlocker).toContain("任务太大");
  });
});
