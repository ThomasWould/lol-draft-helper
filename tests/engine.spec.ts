import { test, expect } from "@playwright/test";
import roster from "../src/data/champions.json" with { type: "json" };
import { analyzeDraft, comparePlans } from "../src/recommendations/engine";
import { CHAMPIONS, type ChampionKey } from "../src/recommendations/meta";
import { validateDraftSession } from "../src/draftSession";

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
  expect(validateDraftSession(blank)).toEqual(blank);
  for (const value of [
    null,
    [],
    { ...blank, selected: "__proto__" },
    { ...blank, enemyRaw: "x".repeat(2001) },
    { ...blank, enemyBotRaw: 1 },
  ])
    expect(validateDraftSession(value)).toBeNull();
});
