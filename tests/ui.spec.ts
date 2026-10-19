import { test, expect } from "@playwright/test";
import champions from "../src/data/champions.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/versions.json", (route) =>
    route.fulfill({ json: ["16.20.1"] }),
  );
  await page.route("**/data/en_US/champion.json", (route) =>
    route.fulfill({ json: { data: champions } }),
  );
  await page.route("**/img/champion/**", (route) => route.abort());
  await page.route("**/img/item/**", (route) => route.abort());
  await page.route("**/splash/**", (route) => route.abort());
});

test("example draft reveals a plan and copy includes the selected champion and item order", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          document.body.dataset.copiedBuild = text;
        },
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A draft worth preparing for." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore an example", exact: true })
    .click();
  await expect(page.locator(".draftStatus")).toHaveText("Draft adapted");
  await expect(page.locator(".enemySlot.filled")).toHaveCount(5);
  await page.getByRole("button", { name: "Copy build", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  const copied = await page.locator("body").getAttribute("data-copied-build");
  expect(copied).toContain("Master Yi · Jungle · Patch 26.20");
  expect(copied).toContain("1. Kraken Slayer");
  expect(copied).toContain("6. Guardian Angel");
});

test("autocomplete can be operated by keyboard and failed artwork has readable fallbacks", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Enemy team", exact: true });
  await input.fill("Malp");
  await expect(
    page.getByRole("listbox", { name: "Enemy team suggestions" }),
  ).toBeVisible();
  await input.press("Enter");
  await expect(input).toHaveValue("Malphite, ");
  await expect(
    page.getByRole("listbox", { name: "Enemy team suggestions" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Remove Malphite" }),
  ).toBeVisible();
  await expect(page.locator(".pickPortrait > span")).toHaveText("MY");
  await expect(page.locator(".enemySlot.filled .gameIcon > span")).toHaveText(
    "M",
  );
});

test("coach suggestions prepare a question without sending and collapse stays accessible", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/coach", (route) => {
    requests++;
    return route.fulfill({ json: { text: "Mock reply" } });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Win condition", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Ask coach" })).toHaveValue(
    "What is my win condition against this draft?",
  );
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Collapse coach" }).click();
  await expect(
    page.getByRole("button", { name: "Expand coach" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("textbox", { name: "Ask coach" })).toHaveCount(0);
  await page.getByRole("button", { name: "Expand coach" }).click();
  await expect(page.getByRole("textbox", { name: "Ask coach" })).toHaveValue(
    "What is my win condition against this draft?",
  );
});

test("draft, build and coach fit phone, tablet, desktop and wide layouts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("combobox").selectOption("heimerdinger");
  await page
    .getByRole("textbox", { name: "Enemy top", exact: true })
    .fill("Mordekaiser");
  await page.getByText("Full runes, skills & situational advice").click();
  for (const width of [320, 375, 768, 900, 1100, 1440, 1680]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `${width}px should not overflow`,
    ).toBeTruthy();
    const plan = await page.locator(".planCard").boundingBox();
    const draft = await page.locator(".inputsCard").boundingBox();
    expect(plan?.width).toBeGreaterThan(245);
    if (width >= 900) expect(plan!.x).toBeGreaterThan(draft!.x + draft!.width);
    else expect(plan!.y).toBeGreaterThan(draft!.y);
  }
});
