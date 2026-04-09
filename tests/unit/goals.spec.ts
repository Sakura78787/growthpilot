import { describe, expect, it } from "vitest";

import { buildGoalPlan } from "@/lib/mock/seed-data";

describe("buildGoalPlan", () => {
  it("creates clean Chinese milestone and task copy for a self-discipline goal", () => {
    const result = buildGoalPlan({
      title: "把作息调回 23 点前入睡",
      category: "discipline",
    });

    expect(result.milestones).toHaveLength(3);
    expect(result.milestones[0]?.title).toBe("第一周先稳定在 23:30 前收尾");
    expect(result.tasks[0]?.title).toBe("今晚 23:30 前关闭短视频");
  });

  it("keeps title interpolation readable for a job goal", () => {
    const result = buildGoalPlan({
      title: "做出两个能投产品经理暑期实习的项目",
      category: "job",
    });

    expect(result.milestones[2]?.title).toBe("围绕「做出两个能投产品经理暑期实习的项目」完成一次完整投递材料打磨");
    expect(result.tasks[1]?.title).toBe("补 1 个数据分析视角的小结");
  });
});
