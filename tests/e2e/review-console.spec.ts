import { expect, test } from "@playwright/test";

test("review page shows Chinese summary and console entry", async ({ page }) => {
  await page.goto("/review");
  await expect(page.getByText("本周复盘")).toBeVisible();
  await expect(page.getByText("下周建议")).toBeVisible();
  await page.goto("/console");
  await expect(page.getByText("北极星指标")).toBeVisible();
});
