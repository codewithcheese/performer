import { test, expect } from "@playwright/test";

test("has messages", async ({ page }) => {
  await page.goto("/chat");

  // click all messages button
  await page.click("#radix-\\:r0\\:-trigger-all");

  // expect system message
  await expect(page.getByText("Greet the user.")).toBeVisible();

  await expect(page).toHaveTitle("Performer Playground");
});
