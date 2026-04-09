import { describe, expect, it } from "vitest";

import { runWithOptionalDbFallback } from "@/lib/cloudflare/env";

describe("runWithOptionalDbFallback", () => {
  it("returns the operation result when the DB call succeeds", async () => {
    const result = await runWithOptionalDbFallback(
      async () => "db-value",
      "fallback-value",
    );

    expect(result).toBe("db-value");
  });

  it("returns the fallback value when the DB call throws", async () => {
    const result = await runWithOptionalDbFallback(
      async () => {
        throw new Error("missing-table");
      },
      "fallback-value",
    );

    expect(result).toBe("fallback-value");
  });
});
