import { test, expect } from "@playwright/test";

test("has messages", async ({ page }) => {
  await page.goto("/chat");

  await expect(page.getByText("Greet the user.")).toBeVisible();

  await expect(page).toHaveTitle("Performer Playground");
});
