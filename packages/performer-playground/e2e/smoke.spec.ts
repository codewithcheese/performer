import { test, expect } from "@playwright/test";

test("has messages", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Greet the user.")).toBeVisible();
  await expect(
    page.getByText("Good day sir! How may I serve the?"),
  ).toBeVisible();
  await expect(
    page.getByText("Tell the valet I will be leaving at 6pm"),
  ).toBeVisible();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle("Performer Playground");
});
