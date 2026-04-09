import { describe, expect, it } from "vitest";

import { buildWeeklyReviewFallback } from "@/lib/ai/rules";

describe("buildWeeklyReviewFallback", () => {
  it("creates a Chinese summary with mood and energy signals when logs exist", () => {
    const result = buildWeeklyReviewFallback({
      completionRate: 68,
      topDelayReason: "任务太大",
      bestFocusPeriod: "20:00 - 22:00",
      dominantMoodLabel: "很有干劲",
      averageEnergyLevel: 4,
    });

    expect(result.summary).toContain("你本周已经完成了 68%");
    expect(result.summary).toContain("很有干劲");
    expect(result.summary).toContain("4/5");
    expect(result.advice).toContain("任务太大");
    expect(result.highlights).toContain("主导状态：很有干劲");
    expect(result.highlights).toContain("平均精力：4/5");
  });
});
