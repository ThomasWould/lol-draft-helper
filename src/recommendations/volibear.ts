// src/recommendations/volibear.ts
import type { DraftTags } from "./tags";
import type { ChampRec } from "./masterYi";

export function getVolibearRec(tags: DraftTags): ChampRec {
  const runesLine = tags.rangedTop
    ? "RUNES: Grasp + Second Wind (poke lane stability)"
    : "RUNES: PTA (kill pressure) or Grasp (matchup dependent)";

  const start = tags.rangedTop
    ? "START: Doran’s Shield (don’t bleed out to poke)"
    : "START: Doran’s Blade (stronger all-in threat)";

  const laneRule = tags.rangedTop
    ? "LANE RULE: Stay healthy → farm safely → all-in windows after level 6"
    : "LANE RULE: Short trades early → slow push → crash wave → dive window with R";

  const boots = tags.heavyAP ? "Merc Treads" : "Plated Steelcaps (or Mercs if CC-heavy)";

  const itemsOrdered = [
    { name: boots },
    { name: "First item: Sundered Sky / Iceborn (matchup dependent)" },
    { name: tags.heavyAP ? "MR item: Spirit Visage / Force of Nature" : "Armor/HP item: Frozen Heart / Randuin’s" },
    { name: tags.healing ? "Bramble/Thornmail (anti-heal timing)" : "Flex slot: damage or resist to match game" },
    { name: "Finish tank items + play front-to-back" },
  ];

  const fightRule = "FIGHT RULE: Q-stun priority target → drop E for shield zone → W twice for sustain → turn dives with R";

  return {
    headlineLines: [runesLine, start, laneRule],
    itemsOrdered,
    fightRule,

    // keep existing fields for later
    runes: [
      tags.rangedTop
        ? "Runes: Resolve (Grasp) + Second Wind + Unflinching (stability vs poke)"
        : "Runes: Resolve (Grasp) or Precision (PTA) depending on matchup",
      "Secondary: Precision (Triumph/Last Stand) or Sorcery for scaling",
    ],
    skillOrder: "Skill order: W > Q > E (take R whenever available).",
    starter: [start, "Summoners: Flash + Teleport (usually)"],
    coreItems: [
      "Core ideas: 1 defensive item + 1 damage item (adapt to lane + enemy comp).",
      tags.heavyAP ? "Consider early MR component if enemy is heavy AP." : "Armor/HP if heavy AD/auto attackers.",
    ],
    situational: [
      "If you need stickiness: movement/slow tools help secure Q engages.",
      "If you’re frontlining: prioritize resistances after first damage spike.",
    ],
    notes: [tags.healing ? "If enemy has strong healing, plan anti-heal timing." : ""].filter(Boolean),
  };
}
