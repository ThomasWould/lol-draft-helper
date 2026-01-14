// src/recommendations/volibear.ts
import type { DraftTags } from "./tags";
import type { ChampRec } from "./masterYi";

export function getVolibearRec(tags: DraftTags): ChampRec {
  const laneStarter = tags.rangedTop
    ? "Start: Doran’s Shield (vs poke) + Second Wind style trading"
    : "Start: Doran’s Blade (vs melee) for stronger all-ins";

  const runePage = tags.rangedTop
    ? "Runes: Resolve (Grasp) + Second Wind + Unflinching (stability vs poke)"
    : "Runes: Resolve (Grasp) or Precision (PTA) depending on matchup";

  const antiHeal = tags.healing ? "If lane/comp has strong healing, plan anti-heal timing." : "";

  return {
    runes: [runePage, "Secondary: Precision (Triumph/Last Stand) or Sorcery for scaling"],
    skillOrder: "Skill order: Q > W > E (take R whenever available).",
    starter: [laneStarter, "Summoners: Flash + Teleport (usually)"],
    coreItems: [
      "Core ideas: 1 defensive item + 1 damage item (adapt to lane + enemy comp).",
      tags.heavyAP ? "Consider early MR component if enemy is heavy AP." : "Armor/HP if heavy AD/auto attackers.",
    ],
    situational: [
      "If you need stickiness: movement/slow tools help secure Q engages.",
      "If you’re frontlining: prioritize resistances after first damage spike.",
    ],
    notes: ["Lane plan: short trades early; look for all-in windows with Q stun + W mark.", antiHeal].filter(Boolean),
  };
}
