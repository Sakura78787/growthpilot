import { describe, expect, it } from "vitest";

import { buildDashboardViewModel } from "@/lib/db/queries/goals";

describe("buildDashboardViewModel", () => {
  it("builds dashboard cards from persisted goal detail", () => {
    const result = buildDashboardViewModel({
      goal: {
        id: "goal-1",
        title: "做出两个能投产品经理暑期实习的项目",
        category: "job",
      },
      tasks: [
        { id: "task-1", title: "优化项目描述", status: "doing" },
        { id: "task-2", title: "补数据分析小结", status: "todo" },
        { id: "task-3", title: "拆成 20 分钟动作", status: "done" },
        { id: "task-4", title: "多余任务", status: "todo" },
      ],
    });

    expect(result.goalTitle).toBe("做出两个能投产品经理暑期实习的项目");
    expect(result.goalCategoryLabel).toBe("求职");
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0]?.status).toBe("doing");
  });
});
