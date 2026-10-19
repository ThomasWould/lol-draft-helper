import { writeFile } from "node:fs/promises";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(
    "Pass a reviewed Data Dragon version, e.g. npm run data:refresh -- 16.20.1",
  );
}
const root = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/`;
async function get(name) {
  const response = await fetch(root + name, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const json = await response.json();
  if (!json.data || typeof json.data !== "object")
    throw new Error(`Invalid ${name}`);
  return json.data;
}
const [champions, items] = await Promise.all([
  get("champion.json"),
  get("item.json"),
]);
const runeResponse = await fetch(root + "runesReforged.json", {
  signal: AbortSignal.timeout(15000),
});
if (!runeResponse.ok) throw new Error(`Runes: HTTP ${runeResponse.status}`);
const runeTrees = await runeResponse.json();
if (!Array.isArray(runeTrees) || runeTrees.length !== 5)
  throw new Error("Invalid rune catalog");
const runes = runeTrees.flatMap((tree) =>
  tree.slots.flatMap((slot, index) =>
    slot.runes.map((rune) => ({
      name: rune.name,
      tree: tree.name,
      slot: index,
      icon: rune.icon,
    })),
  ),
);
await writeFile(
  new URL("../src/data/runes.json", import.meta.url),
  JSON.stringify({ version, runes }, null, 2) + "\n",
);
const roster = Object.fromEntries(
  Object.entries(champions).map(([id, c]) => [
    id,
    {
      id: c.id,
      key: c.key,
      name: c.name,
      image: { full: c.image.full },
      tags: c.tags,
      stats: { attackrange: c.stats.attackrange },
    },
  ]),
);
const itemNames = [
  ...new Set(
    Object.values(items)
      .filter(
        (i) => i.maps?.["11"] && i.gold.purchasable && i.inStore !== false,
      )
      .map((i) => i.name),
  ),
].sort();
const itemIcons = Object.fromEntries(
  Object.values(items)
    .filter((i) => i.maps?.["11"] && i.gold.purchasable && i.inStore !== false)
    // Duplicate names can include mode variants. Let the base item win.
    .sort((a, b) => parseInt(b.image.full) - parseInt(a.image.full))
    .map((i) => [i.name, i.image.full]),
);
await writeFile(
  new URL("../src/data/champions.json", import.meta.url),
  JSON.stringify(roster, null, 2) + "\n",
);
await writeFile(
  new URL("../src/data/item-icons.json", import.meta.url),
  JSON.stringify(itemIcons, null, 2) + "\n",
);
await writeFile(
  new URL(`../tests/fixtures/items-${version}.json`, import.meta.url),
  JSON.stringify(itemNames, null, 2) + "\n",
);
console.log(
  `Saved ${Object.keys(roster).length} champions and ${itemNames.length} item names for ${version}. Review builds, sources, META and test fixture imports separately.`,
);
