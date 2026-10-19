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
  await page.route("**/perk-images/**", (route) => route.abort());
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

test("draft survives reload and clearing can be undone without losing lane matchups", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("combobox").selectOption("volibear");
  await page
    .getByRole("textbox", { name: "Enemy team", exact: true })
    .fill("Vi, Lux");
  await page
    .getByRole("textbox", { name: "Enemy top", exact: true })
    .fill("Teemo");
  await expect(page.getByText("Draft saved on this device")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("combobox")).toHaveValue("volibear");
  await expect(
    page.getByRole("textbox", { name: "Enemy top", exact: true }),
  ).toHaveValue("Teemo");
  await expect(page.locator(".enemySlot.filled")).toHaveCount(3);
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.locator(".enemySlot.filled")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo clear" }).click();
  await expect(page.locator(".enemySlot.filled")).toHaveCount(3);
  await expect(
    page.getByRole("textbox", { name: "Enemy top", exact: true }),
  ).toHaveValue("Teemo");
  await page.getByRole("button", { name: "Clear all" }).click();
  await page
    .getByRole("textbox", { name: "Enemy team", exact: true })
    .fill("Jinx");
  await expect(page.getByRole("button", { name: "Undo clear" })).toHaveCount(0);
});

test("shared link round trips bot matchups and subsequent edits survive a reload", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          document.body.dataset.draftLink = text;
        },
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("combobox").selectOption("missfortune");
  await page
    .getByRole("textbox", { name: "Enemy bot lane" })
    .fill("Jinx, Leona");
  await page.getByRole("button", { name: "Share draft", exact: true }).click();
  const link = await page.locator("body").getAttribute("data-draft-link");
  expect(link).toContain("#draft=");
  await page.goto("/");
  await page.getByRole("combobox").selectOption("lux");
  await page
    .getByRole("textbox", { name: "Enemy bot lane" })
    .fill("Ashe, Soraka");
  await page.goto(link!);
  await expect(page.getByRole("combobox")).toHaveValue("missfortune");
  await expect(
    page.getByRole("textbox", { name: "Enemy bot lane" }),
  ).toHaveValue("Jinx, Leona");
  await expect(
    page.getByText("Shared draft loaded.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Enemy bot lane" })
    .fill("Ashe, Soraka");
  await expect(page.getByText("Draft saved on this device")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Enemy bot lane" }),
  ).toHaveValue("Ashe, Soraka");
});

test("invalid share payloads and blocked storage or clipboard do not break drafting", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Blocked");
    };
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    });
  });
  await page.goto("/#draft=%7Bbad");
  await expect(
    page.getByText(
      "This draft link could not be read. Start a new draft below.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore an example", exact: true })
    .click();
  await expect(page.locator(".itemRow")).toHaveCount(6);
  await page.getByRole("button", { name: "Share draft", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Draft share link" }),
  ).toHaveValue(/#draft=/);
  await expect(page.getByText("Draft stays open in this tab")).toBeVisible();
});

test("lock-in shows a complete setup, checklist and compact responsive plan", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore an example", exact: true })
    .click();
  await page.getByRole("button", { name: "Lock-in view", exact: true }).click();
  await expect(page.getByRole("region", { name: "Draft setup" })).toBeHidden();
  const setup = page.getByRole("region", { name: "Lock-in preparation" });
  await expect(setup).toContainText("Lethal Tempo");
  await expect(setup).toContainText("Smite + Flash");
  await expect(setup).toContainText("Q > E > W");
  for (const name of [
    "Rune page set",
    "Summoner spells checked",
    "First buy planned",
  ])
    await page.getByRole("checkbox", { name }).check();
  await expect(setup).toContainText("Ready for the Rift");
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page
    .getByRole("button", { name: "Back to draft", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "Draft setup" })).toBeVisible();
  await page.getByRole("button", { name: "Lock-in view", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Rune page set" }),
  ).not.toBeChecked();
});

test("lane quick picks select, replace and limit matchups without duplicating enemies", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore an example", exact: true })
    .click();
  await page.getByRole("combobox").selectOption("volibear");
  await page
    .getByRole("button", { name: "Use Malphite in top matchup", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Enemy top", exact: true }),
  ).toHaveValue("Malphite");
  await page
    .getByRole("button", { name: "Use Lux in top matchup", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Enemy top", exact: true }),
  ).toHaveValue("Lux");
  await page.getByRole("combobox").selectOption("missfortune");
  await page
    .getByRole("button", { name: "Use Jinx in bot matchup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use Leona in bot matchup", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use Lux in bot matchup", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".enemySlot.filled")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Use Leona in bot matchup", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use Lux in bot matchup", exact: true }),
  ).toBeEnabled();
  await page.getByText("Full runes, skills & situational advice").click();
  await expect(page.locator(".recDetails .runeChoice.keystone")).toContainText(
    "First Strike",
  );
});
