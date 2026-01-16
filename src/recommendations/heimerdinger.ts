// src/recommendations/heimerdinger.ts
import type { DraftTags } from "./tags";
import type { ChampRec, OrderedItem } from "./masterYi";

function hasAny(enemies: string[], keys: string[]) {
  return enemies.some((e) => keys.some((k) => e.includes(k)));
}

function pickStart(tags: DraftTags, enemyTop?: string) {
  const top = (enemyTop || "").trim();
  const pokeTop = ["teemo", "quinn", "kennen", "jayce", "gnar", "vayne"];
  const topIsPoke = !!top && pokeTop.some((k) => top.includes(k));
  if (topIsPoke || tags.heavyCCBurst) return "Doran’s Shield";
  return "Doran’s Ring";
}

export function getHeimerdingerRec(
  tags: DraftTags,
  enemies: string[] = [],
  enemyTop?: string
): ChampRec {
  // More “most common” rune line for top Heimer
  const runeLine =
    "RUNES: Summon Aery or Arcane Comet — Manaflow + Transcendence; Scorch into melee";

  const start = pickStart(tags, enemyTop);
  const startLine =
    start === "Doran’s Shield"
      ? "START: Doran’s Shield (survive poke / don’t get chipped out)"
      : "START: Doran’s Ring (lane control + mana)";

  const laneRule =
    "LANE RULE: Turrets down before trades → hold E to punish engage → slow push + crash with turret setup";

  // Fix assassin detection: normalized enemies include “khazix”
  const needsZhonyas =
    tags.heavyAD ||
    tags.heavyCCBurst ||
    hasAny(enemies, ["zed", "talon", "naafiri", "khazix", "qiyana", "rengar", "vi"]);

  // “BUY HERE” parity line (like Yi QSS timing)
  const stasisLine = needsZhonyas
    ? "STASIS: BUY HERE — early Stopwatch/Seeker’s if they can dive you (Zed/Vi/Kha etc.)"
    : "STASIS: Optional — rush Zhonya only if you’re getting hard-dived";

  // Core build: Blackfire → Sorcs → Liandry → (Zhonya/Rylai) → Deathcap → (Void/Shadowflame)
  const items: OrderedItem[] = [];
  items.push({ name: "Blackfire Torch", note: "(core burn spike)" });
  items.push({ name: "Sorcerer’s Shoes" });
  items.push({ name: "Liandry’s Torment", note: "(excellent vs HP/frontline)" });

  const needsRylais =
    tags.tanky || hasAny(enemies, ["darius", "garen", "udyr", "volibear", "sett", "olaf"]);

  if (needsZhonyas) {
    items.push({ name: "Zhonya’s Hourglass", note: "(anti-dive / buy time for turrets)" });
  } else if (needsRylais) {
    items.push({ name: "Rylai’s Crystal Scepter", note: "(kite + zone control)" });
  } else {
    items.push({ name: "Rylai’s Crystal Scepter", note: "(default utility)" });
  }

  items.push({ name: "Rabadon’s Deathcap", note: "(big AP closeout)" });

  // Deterministic 6th slot (no “Void but maybe Shadowflame” ambiguity)
  const hasMRStack =
    hasAny(enemies, ["galio", "ornn", "maokai", "zac", "ksante"]) || tags.tanky;

  items.push(
    hasMRStack
      ? { name: "Void Staff", note: "(if they stack MR)" }
      : { name: "Shadowflame", note: "(if they don’t stack MR)" }
  );

  const fightRule =
    "FIGHT RULE: Don’t walk in first — set turrets, fish for E stun → R+E for picks or R+Q to hold a zone/objective";

  return {
    // 4 headline lines like Yi/Voli
    headlineLines: [runeLine, startLine, stasisLine, laneRule],
    itemsOrdered: items.slice(0, 6),
    fightRule,
    bans: ["Irelia", "Yasuo", "Nasus", "Syndra", "Olaf"],

    runes: [
      "Sorcery: Aery/Comet | Manaflow Band | Transcendence | Scorch (or Gathering Storm)",
      "Secondary: Inspiration (Biscuit + Cosmic) or Precision (Presence of Mind) depending on comfort",
      "Shards: Adaptive / Adaptive / Health",
    ],
    skillOrder: "Skill order: Q > W > E (take R whenever available).",
    starter: [start, "Summoners: Flash + Teleport (usually)"],
    coreItems: items.slice(0, 6).map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      "If they have multiple divers: Zhonya earlier + play tighter around turret nests.",
      "If enemy stacks MR: Void Staff earlier (4th/5th).",
      "If you need perma-kite: Rylai earlier and use turrets as a slow field.",
    ],
    notes: [
      "Your power is pre-setup: fights are easiest when you own the space before they arrive.",
      tags.tanky ? "Burn items (Blackfire/Liandry) are extra valuable vs frontline." : "",
    ].filter(Boolean),
  };
}
