// src/recommendations/masterYi.ts
import type { DraftTags } from "./tags";

export type OrderedItem = {
  name: string;
  note?: string; // e.g. "BUY HERE (Vex fear / Alistar CC)"
};

export type ChampRec = {
  // New “coach note” style sections
  headlineLines: string[]; // RUNES / HoB / W POINTS / START etc.
  itemsOrdered: OrderedItem[];
  fightRule?: string;

  // Keep these for later / optional UI sections
  runes: string[];
  skillOrder: string;
  starter: string[];
  coreItems: string[];
  situational: string[];
  notes: string[];
};

function pickStart(tags: DraftTags) {
  // Simple default: Red start unless comp screams invade/level 1 CC
  if (tags.heavyCCBurst) return "START: BLUE (safer vs early CC / skirmish threat)";
  return "START: RED (standard tempo / stronger early clear)";
}

export function getMasterYiRec(tags: DraftTags): ChampRec {
  const runeMain = tags.tanky ? "RUNES: Lethal Tempo + CUT DOWN" : "RUNES: Lethal Tempo + COUP DE GRACE";

  // HoB heuristic: if enemy comp is CC/burst heavy, HoB feels terrible
  const hob =
    tags.heavyCCBurst
      ? "HoB: NO — enemy has burst/CC that denies your reset fights"
      : "HoB: OPTIONAL — can work in squishier comps, but LT is safer baseline";

  const wPoints = tags.heavyCCBurst
    ? "W POINTS: YES (1 extra early if even/behind) — helps survive burst windows"
    : "W POINTS: NO (standard Q>E) — add W early only if you’re getting chunked";

  const start = pickStart(tags);

  const boots = tags.heavyCCBurst || tags.heavyAP ? "Merc Treads" : "Berserker’s Greaves";

  // Ordered items logic (MVP)
  const items: OrderedItem[] = [
    { name: "Kraken Slayer" },
    { name: "Guinsoo’s Rageblade" },
  ];

  // Insert QSS early if burst+CC is high (this matches your example style)
  if (tags.heavyCCBurst) {
    items.push({ name: "QSS", note: "← BUY HERE (key CC threat / hard engage)" });
  }

  items.push({ name: boots });
  items.push({ name: tags.heavyAP ? "Wit’s End" : "Wit’s End / Death’s Dance (as needed)" });

  // GA is a nice closer when you’re carrying
  items.push({ name: "Guardian Angel" });

  // Fight rule: concise + helpful
  const fightRule = tags.heavyCCBurst
    ? "FIGHT RULE: Wait out primary engage → QSS/cleanse key CC → kill easiest squishy carry → reset"
    : "FIGHT RULE: Hold Q until key CC is used → kill backline carry → chain resets";

  const runesLong = [
    tags.tanky ? "Precision: Lethal Tempo | Cut Down" : "Precision: Lethal Tempo | Coup de Grace",
    tags.heavyCCBurst || tags.heavyAP
      ? "Secondary: Resolve (Second Wind/Conditioning) + Unflinching"
      : "Secondary: Domination (Treasure Hunter) or Resolve (Conditioning)",
    "Shards: AS / Adaptive / (Armor or MR depending on comp)",
  ];

  return {
    headlineLines: [runeMain, hob, wPoints, start],
    itemsOrdered: items,
    fightRule,

    // keep existing fields (still useful later)
    runes: runesLong,
    skillOrder: "Skill order: Q > E > W (take R whenever available).",
    starter: ["Jungle item + Refillable", "Smite + Flash"],
    coreItems: [
      `Core: Kraken Slayer → Guinsoo's Rageblade → ${boots}`,
      tags.heavyAP ? "Wit's End earlier if getting chunked by AP" : "Wit's End/Death's Dance as needed",
    ],
    situational: [
      "Vs tanks: Blade of the Ruined King earlier can help.",
      "Vs hard CC: QSS (into Mercurial) can be game-saving.",
      tags.heavyAP ? "Consider early Wit's End component" : "Standard tempo items",
    ].filter(Boolean),
    notes: [
      tags.heavyCCBurst
        ? "Enemy has burst/CC — consider 1–2 early points in W to survive spikes."
        : "Max Q/E as usual; W points are situational.",
      tags.healing ? "Add anti-heal if needed (Executioner’s later if appropriate)." : "",
    ].filter(Boolean),
  };
}
