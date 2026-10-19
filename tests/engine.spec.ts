import { test, expect } from "@playwright/test";
import roster from "../src/data/champions.json" with { type: "json" };
import { analyzeDraft, comparePlans } from "../src/recommendations/engine";
import { CHAMPIONS, type ChampionKey } from "../src/recommendations/meta";
import { validateDraftSession } from "../src/draftSession";
import { BUILD_STYLES } from "../src/recommendations/styles";
import { validateRunePage } from "../src/recommendations/runes";
import itemNames from "./fixtures/items-16.20.1.json" with { type: "json" };
import { normalizeLoose } from "../src/draft";

const champs = Object.values(roster);
const blank = {
  selected: "masteryi" as ChampionKey,
  enemyRaw: "",
  enemyTopRaw: "",
  enemyBotRaw: "",
};

test("shared engine registers every champion and ignores inactive lane fields", () => {
  for (const selected of Object.keys(CHAMPIONS) as ChampionKey[]) {
    const empty = analyzeDraft({ ...blank, selected }, champs);
    expect(empty.rec.itemsOrdered).toHaveLength(6);
    expect(comparePlans(empty.baseline, empty.rec)).toEqual({
      items: [],
      runesChanged: false,
      startChanged: false,
    });
  }
  const jungle = analyzeDraft(
    {
      ...blank,
      enemyRaw: "Jinx",
      enemyTopRaw: "Malphite",
      enemyBotRaw: "Lux, Leona",
    },
    champs,
  );
  expect(jungle.scoutChamps.map((c) => c.name)).toEqual(["Jinx"]);
  const top = analyzeDraft(
    {
      ...blank,
      selected: "volibear",
      enemyRaw: "Vi, Teemo, Lux, Jinx, Leona, Ashe",
      enemyTopRaw: "Teemo, Malphite",
    },
    champs,
  );
  expect(top.scoutChamps).toHaveLength(5);
  expect(top.scoutChamps[0].name).toBe("Teemo");
  expect(top.tags.rangedTop).toBeTruthy();
});

test("plan comparisons reflect exact item and rune deltas without treating punctuation as a swap", () => {
  const { rec, baseline } = analyzeDraft(
    { ...blank, enemyRaw: "Malphite, Leona, Malzahar" },
    champs,
  );
  const changes = comparePlans(baseline, rec);
  expect(changes.runesChanged).toBeTruthy();
  expect(changes.items.find((change) => change.slot === 6)?.after).toBe(
    "Mercurial Scimitar",
  );
  for (const change of changes.items) {
    expect(change.before).toBe(baseline.itemsOrdered[change.slot - 1].name);
    expect(change.after).toBe(rec.itemsOrdered[change.slot - 1].name);
  }
  const same = {
    ...baseline,
    itemsOrdered: baseline.itemsOrdered.map((item) => ({
      ...item,
      name: item.name.replaceAll("'", "’"),
    })),
  };
  expect(comparePlans(baseline, same).items).toEqual([]);
});

test("stored and shared drafts reject unsupported champions and oversized fields", () => {
  expect(validateDraftSession(blank)).toEqual({
    ...blank,
    alliesRaw: "",
    buildStyle: "auto",
  });
  for (const value of [
    null,
    [],
    { ...blank, selected: "__proto__" },
    { ...blank, enemyRaw: "x".repeat(2001) },
    { ...blank, enemyBotRaw: 1 },
  ])
    expect(validateDraftSession(value)).toBeNull();
});

test("all selected styles keep legal runes, inventory and defensive adaptation", () => {
  const catalog = new Set(itemNames.map(normalizeLoose));
  for (const selected of Object.keys(CHAMPIONS) as ChampionKey[]) {
    for (const option of BUILD_STYLES[selected]) {
      for (const enemyRaw of [
        "Jinx",
        "Malphite, Leona, Malzahar, Soraka, Lux",
      ]) {
        const result = analyzeDraft(
          {
            ...blank,
            selected,
            buildStyle: option.id,
            enemyRaw,
            enemyBotRaw: "Lux, Jinx",
          },
          champs,
        );
        expect(result.style).toBe(option.id);
        expect(validateRunePage(result.rec.runes)).toEqual([]);
        const items = result.rec.itemsOrdered.map((item) =>
          normalizeLoose(item.name),
        );
        expect(items).toHaveLength(6);
        expect(new Set(items).size).toBe(6);
        for (const item of items) expect(catalog.has(item)).toBeTruthy();
        expect(
          items.filter((item) =>
            [
              "lorddominiksregards",
              "mortalreminder",
              "terminus",
              "seryldasgrudge",
            ].includes(item),
          ).length,
        ).toBeLessThanOrEqual(1);
      }
    }
  }
  const crit = analyzeDraft(
    { ...blank, buildStyle: "crit", enemyRaw: "Malphite, Leona, Malzahar" },
    champs,
  );
  expect(crit.rec.runes[0]).toContain("Hail of Blades");
  expect(crit.rec.itemsOrdered.at(-1)?.name).toBe("Mercurial Scimitar");
  expect(
    crit.rec.itemsOrdered.some((item) => item.name === "The Collector"),
  ).toBeTruthy();
  const onhit = analyzeDraft(
    { ...blank, buildStyle: "onhit", enemyRaw: "Jinx" },
    champs,
  );
  expect(onhit.rec.runes[0]).toContain("Lethal Tempo");
  expect(
    onhit.rec.itemsOrdered.some((item) => item.name === "Guinsoo's Rageblade"),
  ).toBeTruthy();
});

test("allied teams include the player once, exclude conflicts and do not contaminate enemy analysis", () => {
  const result = analyzeDraft(
    {
      ...blank,
      enemyRaw: "Jinx",
      alliesRaw:
        "Master Yi, Ornn, Ornn, Lulu, Orianna, Ashe, Jinx, Teemo, typo",
    },
    champs,
  );
  expect(result.teammates.map((c) => c.name)).toEqual([
    "Ornn",
    "Lulu",
    "Orianna",
    "Ashe",
  ]);
  expect(result.team.members).toHaveLength(5);
  expect(result.allyConflicts.map((c) => c.name)).toEqual(["Jinx"]);
  expect(result.allyUnmatched).toEqual(["typo"]);
  expect(result.allyOverflow).toBeTruthy();
  expect(result.team.engagers).toContain("Ornn");
  expect(result.team.protectors).toContain("Lulu");
  expect(result.team.advice.join(" ")).toContain("Let Ornn commit first");
  const withoutAllies = analyzeDraft({ ...blank, enemyRaw: "Jinx" }, champs);
  expect(result.tags).toEqual(withoutAllies.tags);
  expect(result.rec.itemsOrdered).toEqual(withoutAllies.rec.itemsOrdered);
  expect(
    analyzeDraft({ ...blank, alliesRaw: "Ornn" }, champs).team.complete,
  ).toBeFalsy();
  expect(validateDraftSession({ ...blank, buildStyle: "comet" })).toBeNull();
  expect(
    validateDraftSession({ ...blank, alliesRaw: "x".repeat(2001) }),
  ).toBeNull();
});
