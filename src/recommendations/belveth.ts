// src/recommendations/belveth.ts
import type { DraftTags } from "./tags";
import type { ChampRec, OrderedItem } from "./masterYi";

function hasAny(enemies: string[], keys: string[]) {
  return enemies.some((e) => keys.some((k) => e.includes(k)));
}

function needsQSS(enemies: string[]) {
  // same philosophy as Yi: “this ruins my carry pattern”
  const QSS_THREATS = ["malzahar", "skarner", "warwick", "lissandra", "vi"];
  return hasAny(enemies, QSS_THREATS);
}

function pickStart(tags: DraftTags, enemies: string[]) {
  // safer start if enemy has brutal lvl1 pick or CC stack
  const LVL1_PICK = ["blitzcrank", "nautilus", "pyke", "thresh", "ashe", "pantheon"];
  if (tags.heavyCCBurst || hasAny(enemies, LVL1_PICK)) {
    return "START: BLUE (safer vs early CC/pick; protect first clear)";
  }
  return "START: RED (standard tempo / stronger early skirmish)";
}

function pickBoots(tags: DraftTags, enemies: string[]) {
  // Respect point/click lockdown similar to Yi logic
  const CC_LOCKDOWN = ["lissandra", "leona", "nautilus", "skarner", "malzahar", "ashe", "pantheon", "vi"];
  const hasLockdown = hasAny(enemies, CC_LOCKDOWN);

  const heavyAutoAD = hasAny(enemies, [
    "jax",
    "tryndamere",
    "yasuo",
    "yone",
    "vayne",
    "kogmaw",
    "kaisa",
    "tristana",
  ]);

  if (tags.heavyCCBurst || (tags.heavyAP && hasLockdown)) return "Merc Treads";
  if (tags.heavyAD || heavyAutoAD) return "Plated Steelcaps";
  return "Berserker’s Greaves";
}

export function getBelvethRec(tags: DraftTags, enemies: string[] = []): ChampRec {
  // Keep runes simple + “most common feel”
  const runeLine =
    "RUNES: Conqueror (default) — Triumph + Alacrity; Coup/Cut Down by enemy HP";

  const startLine = pickStart(tags, enemies);

  // Early plan line (Bel’Veth identity)
  const earlyLine = tags.heavyCCBurst
    ? "EARLY: Farm to item → avoid forced flips; countergank with E damage reduction"
    : "EARLY: Play for skirmishes around crab/Herald → snowball form + tempo";

  const tankTechLine = tags.tanky
    ? "TANK TECH: If 2+ tanks/high HP → consider BORK or Terminus earlier"
    : "TANK TECH: Default Kraken→Stride is fine unless they stack HP/armor";

  // Extra “Bel note” that feels like a real coach line
  const peelLine = hasAny(enemies, ["janna", "poppy", "alistar", "rell", "braum"])
    ? "NOTE: Heavy disengage/anti-dash → enter 2nd, don’t force front-to-back"
    : "NOTE: Look for side angles; don’t front-enter into CC";

  const boots = pickBoots(tags, enemies);

  // Items: common core: Kraken → boots → Stride
  const items: OrderedItem[] = [];
  items.push({ name: "Kraken Slayer" });
  items.push({ name: boots });
  items.push({ name: "Stridebreaker", note: "(stick + tempo for resets)" });

  // Insert QSS timing if suppression/lockdown exists
  if (needsQSS(enemies)) {
    items.splice(3, 0, { name: "QSS", note: "← BUY HERE (suppression/lockdown threat)" });
  }

  // Defensive DPS slot
  if (tags.heavyAP) items.push({ name: "Wit’s End", note: "(vs AP threats)" });
  else items.push({ name: "Death’s Dance", note: "(vs burst / survive dives)" });

  // If we didn’t already add both Wit's and DD, add the other
  const hasWits = items.some((x) => x.name === "Wit’s End");
  const hasDD = items.some((x) => x.name === "Death’s Dance");
  if (!hasWits) items.push({ name: "Wit’s End", note: "(good default mixed resist + DPS)" });
  else if (!hasDD) items.push({ name: "Death’s Dance", note: "(vs burst / survive dives)" });

  // Final “frontline carry” closer
  items.push({ name: "Jak’Sho, The Protean", note: "(frontline carry in long fights)" });

  const fightRule = tags.heavyCCBurst
    ? "FIGHT RULE: Don’t enter first — wait for key CC → E through burst → take reset target → chain form/objectives"
    : "FIGHT RULE: Look for 2v2/3v3 first → secure form off coral → convert to Herald/Baron and snowball map";

  return {
    // 4 headline lines like Yi/Voli
    headlineLines: [runeLine, startLine, earlyLine, tankTechLine, peelLine].slice(0, 4),
    itemsOrdered: items.slice(0, 6),
    fightRule,
    bans: ["Rammus", "Jax", "Poppy", "Vi", "Warwick"],

    // keep detail fields populated
    runes: [
      "Precision: Conqueror | Triumph | Legend: Alacrity | Coup de Grace (or Cut Down vs HP)",
      "Secondary: Inspiration (Magical Footwear + Cosmic Insight) or Resolve if you need durability",
      "Shards: AS / Adaptive / (Armor or MR)",
    ],
    skillOrder: "Skill order: Q > E > W (take R whenever available).",
    starter: ["Jungle item + Refillable", "Smite + Flash"],
    coreItems: items.slice(0, 6).map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      "If heavy suppression/point-click CC: QSS at 3rd–4th slot timing (before midgame fights).",
      "If they stack HP/armor: BORK or Terminus earlier.",
      "If you’re the only engager: lean Jak’Sho/DD sooner and fight slower.",
    ],
    notes: [
      "Bel’Veth wins by turning skirmishes into objectives (Herald/Baron form).",
      tags.heavyCCBurst ? "Respect CC chains — your entry timing matters more than your damage." : "",
    ].filter(Boolean),
  };
}
