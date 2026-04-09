import { describe, expect, it } from "vitest";

import { buildTaskUpdateArtifacts } from "@/lib/db/queries/tasks";

describe("buildTaskUpdateArtifacts", () => {
  it("builds a task patch and task log record for a completed focus session", () => {
    const now = "2026-04-09T12:00:00.000Z";
    const result = buildTaskUpdateArtifacts({
      taskId: "task-demo-1",
      userId: "growthpilot-demo-user",
      payload: {
        status: "done",
        delayReason: "任务太大",
        mood: "motivated",
        energyLevel: 4,
        completionNote: "把简历第一屏重新写顺了",
      },
      now,
      idGenerator: () => "task-log-1",
    });

    expect(result.taskPatch).toMatchObject({
      status: "done",
      delayReason: "任务太大",
      actualEndTime: now,
      completionNote: "把简历第一屏重新写顺了",
    });

    expect(result.logRecord).toEqual({
      id: "task-log-1",
      taskId: "task-demo-1",
      userId: "growthpilot-demo-user",
      result: "done",
      delayReason: "任务太大",
      mood: "motivated",
      energyLevel: 4,
      loggedAt: now,
    });
  });
});
