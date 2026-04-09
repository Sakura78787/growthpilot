import { describe, expect, it } from "vitest";

import { buildWeeklyReviewFallback } from "@/lib/ai/rules";
import { buildReviewSourceFromTasks } from "@/lib/db/queries/reviews";

describe("buildReviewSourceFromTasks v2", () => {
  it("collects recent completion notes for humanized review", () => {
    const result = buildReviewSourceFromTasks(
      [
        {
          status: "done",
          delayReason: null,
          actualStartTime: "2026-04-07T12:30:00.000Z",
          completionNote: "把简历第一屏重写顺了",
        },
        {
          status: "done",
          delayReason: null,
          actualStartTime: "2026-04-08T12:30:00.000Z",
          completionNote: "补完了竞品对比表",
        },
      ],
      [],
    );

    expect(result.recentNotes).toEqual(["把简历第一屏重写顺了", "补完了竞品对比表"]);
  });
});

describe("buildWeeklyReviewFallback v2", () => {
  it("injects user's recent note into summary", () => {
    const result = buildWeeklyReviewFallback({
      completionRate: 68,
      topDelayReason: "任务太大",
      bestFocusPeriod: "20:00 - 22:00",
      dominantMoodLabel: "稳稳推进",
      averageEnergyLevel: 4,
      recentNotes: ["把简历第一屏重写顺了"],
    });

    expect(result.summary).toContain("把简历第一屏重写顺了");
    expect(result.highlights.some((item) => item.includes("最近收获"))).toBe(true);
  });
});
