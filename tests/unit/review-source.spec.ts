import { describe, expect, it } from "vitest";

import { buildReviewSourceFromTasks } from "@/lib/db/queries/reviews";

describe("buildReviewSourceFromTasks", () => {
  it("summarizes completion, delay reason, focus period, mood, and energy from activity", () => {
    const result = buildReviewSourceFromTasks(
      [
        {
          status: "done",
          delayReason: null,
          actualStartTime: "2026-04-07T12:30:00.000Z",
        },
        {
          status: "done",
          delayReason: "任务太大",
          actualStartTime: "2026-04-08T13:00:00.000Z",
        },
        {
          status: "todo",
          delayReason: "任务太大",
          actualStartTime: null,
        },
        {
          status: "doing",
          delayReason: "状态差",
          actualStartTime: "2026-04-09T12:15:00.000Z",
        },
      ],
      [
        {
          result: "doing",
          delayReason: null,
          mood: "motivated",
          energyLevel: 4,
          loggedAt: "2026-04-07T13:10:00.000Z",
        },
        {
          result: "done",
          delayReason: "任务太大",
          mood: "motivated",
          energyLevel: 5,
          loggedAt: "2026-04-08T13:30:00.000Z",
        },
        {
          result: "done",
          delayReason: null,
          mood: "steady",
          energyLevel: 3,
          loggedAt: "2026-04-09T12:45:00.000Z",
        },
      ],
    );

    expect(result.completionRate).toBe(50);
    expect(result.topDelayReason).toBe("任务太大");
    expect(result.bestFocusPeriod).toBe("20:00 - 22:00");
    expect(result.dominantMoodLabel).toBe("很有干劲");
    expect(result.averageEnergyLevel).toBe(4);
  });
});
