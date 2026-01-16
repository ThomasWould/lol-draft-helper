// src/recommendations/masterYi.ts
import type { DraftTags } from "./tags";

export type OrderedItem = {
  name: string;
  note?: string; // e.g. "← BUY HERE (Malz R / Skarner R / Vex fear)"
};

export type ChampRec = {
  headlineLines: string[];
  itemsOrdered: OrderedItem[];
  fightRule?: string;
  bans?: string[];

  // NEW: wave tips (only used by top champs)
  waveTips?: {
    title: string;
    bullets: string[];
  };

  // (kept for later expansion / optional collapsible details)
  runes: string[];
  skillOrder: string;
  starter: string[];
  coreItems: string[];
  situational: string[];
  notes: string[];
};

function hasAny(enemies: string[], keys: string[]) {
  return enemies.some((e) => keys.some((k) => e.includes(k)));
}

function pickStart(tags: DraftTags, enemies: string[]) {
  // basic “safer start” heuristic — if they have crazy level 1 CC/pick, start blue.
  const LVL1_PICK = ["blitzcrank", "nautilus", "pyke", "thresh", "ashe", "pantheon"];
  if (tags.heavyCCBurst || hasAny(enemies, LVL1_PICK)) {
    return "START: BLUE (safer vs early CC/pick)";
  }
  return "START: RED (standard tempo / stronger duels)";
}

function pickBoots(tags: DraftTags, enemies: string[]) {
  const CC_LOCKDOWN = ["lissandra", "leona", "nautilus", "skarner", "malzahar", "ashe", "pantheon", "vi"];
  const hasLockdown = hasAny(enemies, CC_LOCKDOWN);

  if (tags.heavyCCBurst || (tags.heavyAP && hasLockdown)) return "Merc Treads";
  return "Berserker’s Greaves";
}

function needsQSS(enemies: string[]) {
  // This is the stuff that *actually* ruins Yi if you don't answer it.
  const QSS_THREATS = [
    "malzahar", // R
    "skarner",  // R
    "warwick",  // R suppression
    "mordekaiser", // R isolate (QSS doesn't remove realm now, but still signals “problem”)
    "lissandra", // hard point/click CC + chain
  ];
  return hasAny(enemies, QSS_THREATS);
}

function isTankyComp(tags: DraftTags) {
  return tags.tanky;
}

export function getMasterYiRec(tags: DraftTags, enemies: string[] = []): ChampRec {
  // --- RUNES ---
  // Keep your signature "Cut Down vs tanks, Coup otherwise"
  const runeLine = isTankyComp(tags) ? "RUNES: Lethal Tempo + CUT DOWN" : "RUNES: Lethal Tempo + COUP DE GRACE";

  // HoB logic — mostly “NO” when CC/burst exists
  const hobLine =
    tags.heavyCCBurst
      ? "Hail of Blades: NO — CC/burst comp makes it miserable"
      : "Hail of Blades: OPTIONAL — only if enemy is squishy + low CC (LT is safer)";

  // W points logic (your saved preference)
  const wPointsLine =
    tags.heavyCCBurst
      ? "W POINTS: YES (1 extra early if even/behind)"
      : "W POINTS: NO (standard Q>E; only add W early if getting chunked)";

  const startLine = pickStart(tags, enemies);

  // --- ITEM ORDER LOGIC (best/common core) ---
  // Kraken + Guinsoo show up as consistent core across major sites
  const boots = pickBoots(tags, enemies);

  const items: OrderedItem[] = [];

  // 1. Kraken is the most common first item across builds
  items.push({ name: "Kraken Slayer" });

  // 2. Boots — most common is Berserkers, but we override to Mercs when needed
  items.push({ name: boots });

  // 3. Guinsoo is the big spike (very common)
  items.push({ name: "Guinsoo’s Rageblade" });

  // 4. Flex slot: BORK if tanky, Hexplate if you want tempo/snowball
  // (Hexplate appears a lot as a high-winrate option on multiple sites)
  if (isTankyComp(tags)) {
    items.push({ name: "Blade of the Ruined King", note: "(2+ tanks / high HP)" });
  } else {
    items.push({ name: "Experimental Hexplate", note: "(snowball/tempo spike)" });
  }

  // Insert QSS at the correct “BUY HERE” timing:
  // usually right after Guinsoo / before your midgame fights start.
  if (needsQSS(enemies)) {
    // If we already filled slot 4 with BORK/Hexplate, insert QSS before it sometimes
    // but keep it simple: add QSS immediately after Guinsoo if CC is scary.
    items.splice(3, 0, { name: "QSS", note: "← BUY HERE (suppression/lockdown threat)" });
  }

  // 5. Defensive DPS slot (Wit's vs AP, DD vs heavy AD burst)
  if (tags.heavyAP) {
    items.push({ name: "Wit’s End", note: "(vs AP threats)" });
  } else if (tags.heavyAD || tags.heavyCCBurst) {
    items.push({ name: "Death’s Dance", note: "(vs AD burst / survive dives)" });
  } else {
    items.push({ name: "Wit’s End", note: "(good default mixed resist + DPS)" });
  }

  // 6. Closer slot: GA when you’re the wincon, otherwise situational tech
  const critThreat = hasAny(enemies, ["jinx", "caitlyn", "tristana", "tryndamere", "yasuo", "yone", "aphelios"]);
  if (critThreat && (tags.heavyAD || tags.heavyCCBurst)) {
    items.push({ name: "Randuin’s Omen", note: "(anti-crit / anti-burst option)" });
  } else {
    items.push({ name: "Guardian Angel", note: "(protect shutdown / late fights)" });
  }

  // Guarantee exactly 6 shown (clean champ-select card)
  const core6 = items.slice(0, 6);

  // --- FIGHT RULE (the part you like more descriptive) ---
  const fightRule = tags.heavyCCBurst
    ? "FIGHT RULE: Wait out engage → dodge/cleanse key CC → kill easiest carry → chain resets"
    : "FIGHT RULE: Hold Q for their key CC → assassinate backline carry → reset through fight";

  // Keep existing detailed fields (optional future “expand” toggle)
  const runesLong = [
    isTankyComp(tags) ? "Precision: Lethal Tempo | Cut Down" : "Precision: Lethal Tempo | Coup de Grace",
    tags.heavyCCBurst || tags.heavyAP
      ? "Secondary: Resolve (Conditioning/Second Wind) + Unflinching"
      : "Secondary: Domination (Treasure Hunter) or Resolve (Conditioning)",
    "Shards: AS / Adaptive / (Armor or MR depending on comp)",
  ];

  const burstCount = tags.heavyCCBurst ? "High CC/burst detected" : "Normal CC/burst";

  return {
    headlineLines: [runeLine, hobLine, wPointsLine, startLine],
    itemsOrdered: core6,
    fightRule,
    bans: ["Rammus", "Jax", "Poppy", "Warwick", "Viego"],
    runes: runesLong,
    skillOrder: "Skill order: Q > E > W (take R whenever available).",
    starter: ["Jungle item + Refillable", "Smite + Flash"],
    coreItems: core6.map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      "If they have a single unmissable CC chain: QSS → Mercurial can be game-saving.",
      "If they stack armor/HP: BORK earlier + play for extended DPS windows.",
      "If they are heavy AP poke/burst: Wit’s End earlier (don’t greed).",
    ],
    notes: [
      burstCount,
      tags.healing ? "If healing is high: plan anti-heal later (team usually handles, but be aware)." : "",
    ].filter(Boolean),
  };
}
