import { expect, test } from "@playwright/test";

test("landing page shows Chinese GrowthPilot hero copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "稳稳地前进，而不是用力过猛" })).toBeVisible();
  await expect(page.getByRole("link", { name: "开始今日行动" })).toBeVisible();
  await expect(page.getByText("面向中国大陆大学生的成长驾驶舱")).toBeVisible();
});
