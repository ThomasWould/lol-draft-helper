// src/recommendations/masterYi.ts
import type { DraftTags } from "./tags";

export type ChampRec = {
  runes: string[];
  skillOrder: string;
  starter: string[];
  coreItems: string[];
  situational: string[];
  notes: string[];
};

export function getMasterYiRec(tags: DraftTags): ChampRec {
  const runeRow =
    tags.tanky ? "Precision: Lethal Tempo | Cut Down" : "Precision: Lethal Tempo | Coup de Grace";

  const secondary =
    tags.heavyCCBurst || tags.heavyAP
      ? "Secondary: Resolve (Second Wind/Conditioning) + Unflinching"
      : "Secondary: Domination (Treasure Hunter) or Resolve (Conditioning)";

  const boots = tags.heavyCCBurst || tags.heavyAP ? "Merc Treads" : "Berserker's Greaves";
  const earlyMR = tags.heavyAP ? "Consider early Wit's End component" : "Standard tempo items";

  const wNote = tags.heavyCCBurst
    ? "Enemy has burst/CC — consider 1–2 early points in W to survive spikes."
    : "Max Q/E as usual; W points are situational.";

  const antiHeal = tags.healing ? "Add anti-heal if needed (Executioner’s later if appropriate)." : "";

  return {
    runes: [runeRow, secondary, "Shards: AS / Adaptive / (Armor or MR depending on comp)"],
    skillOrder: "Skill order: Q > E > W (take R whenever available).",
    starter: ["Jungle item + Refillable", "Smite + Flash"],
    coreItems: [
      `Core: Kraken Slayer → Guinsoo's Rageblade → ${boots}`,
      tags.heavyAP ? "Wit's End earlier if getting chunked by AP" : "Wit's End/Death's Dance as needed",
    ],
    situational: [
      "Vs tanks: Blade of the Ruined King earlier can help.",
      "Vs hard CC: QSS (into Mercurial) can be game-saving.",
      earlyMR,
    ].filter(Boolean),
    notes: [wNote, antiHeal].filter(Boolean),
  };
}
