import { describe, expect, it } from "vitest";

import { summarizeDelayReasons } from "@/lib/db/queries/analytics";

describe("summarizeDelayReasons", () => {
  it("sorts delay reasons from highest to lowest", () => {
    const rows = [
      { delayReason: "任务太大", count: 4 },
      { delayReason: "状态差", count: 2 },
    ];

    expect(summarizeDelayReasons(rows)[0]).toEqual({
      reason: "任务太大",
      count: 4,
    });
  });
});
