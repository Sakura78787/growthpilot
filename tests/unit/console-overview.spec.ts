import { describe, expect, it } from "vitest";

import { buildConsoleOverviewFromRecords } from "@/lib/db/queries/analytics";

describe("buildConsoleOverviewFromRecords", () => {
  it("summarizes PM console metrics, funnel, segments, review usage, and session signals", () => {
    const result = buildConsoleOverviewFromRecords({
      tasks: [
        { plannedDate: "2026-04-07", status: "done", delayReason: null },
        { plannedDate: "2026-04-08", status: "doing", delayReason: "任务太大" },
        { plannedDate: "2026-04-08", status: "todo", delayReason: "任务太大" },
        { plannedDate: "2026-04-09", status: "done", delayReason: "状态差" },
      ],
      taskLogs: [
        { delayReason: null, mood: "motivated", energyLevel: 4, loggedAt: "2026-04-07T13:10:00.000Z" },
        { delayReason: "任务太大", mood: "motivated", energyLevel: 5, loggedAt: "2026-04-08T13:30:00.000Z" },
        { delayReason: null, mood: "steady", energyLevel: 3, loggedAt: "2026-04-09T12:45:00.000Z" },
      ],
      goals: [
        { category: "job" },
        { category: "job" },
        { category: "study" },
      ],
      reviews: [
        { completionRate: 72 },
        { completionRate: 64 },
      ],
      events: [
        { eventName: "goal.created", eventPayload: "{\"goalId\":\"goal-1\"}" },
        { eventName: "task.updated", eventPayload: "{\"status\":\"doing\"}" },
        { eventName: "task.updated", eventPayload: "{\"status\":\"done\"}" },
        { eventName: "review.generated", eventPayload: "{\"weekStart\":\"2026-04-07\"}" },
      ],
    });

    expect(result.northStar[0]).toEqual({ label: "周有效行动次数", value: 3 });
    expect(result.northStar[1]).toEqual({ label: "周复盘完成率", value: "72%" });
    expect(result.delayReasons[0]).toEqual({ reason: "任务太大", count: 1 });
    expect(result.actionTrend[0]?.day).toBe("周一");
    expect(result.funnel).toEqual([
      { label: "创建目标", value: 1 },
      { label: "开始行动", value: 1 },
      { label: "完成动作", value: 1 },
      { label: "生成复盘", value: 1 },
    ]);
    expect(result.reviewUsage).toEqual([
      { label: "累计复盘次数", value: 2 },
      { label: "平均复盘完成率", value: "68%" },
    ]);
    expect(result.sessionSignals).toEqual([
      { label: "主导状态", value: "很有干劲" },
      { label: "平均精力", value: "4/5" },
    ]);
    expect(result.userSegments[0]).toEqual({
      label: "求职冲刺型",
      value: 2,
      note: "围绕作品集、简历和投递持续推进",
    });
  });
});
