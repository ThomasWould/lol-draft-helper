// src/recommendations/volibear.ts
import type { DraftTags } from "./tags";
import type { ChampRec } from "./masterYi";

function hasAny(enemies: string[], keys: string[]) {
  return enemies.some((e) => keys.some((k) => e.includes(k)));
}

function pickBoots(opts: {
  heavyAP: boolean;
  heavyCCBurst: boolean;
  heavyAD: boolean;
  topIsAP: boolean;
  topIsAutoAD: boolean;
}) {
  // Default: Lucidity (very common on Voli because haste matters a lot)
  // Override if lane or comp demands hard resists.
  if (opts.topIsAutoAD || opts.heavyAD) return "Plated Steelcaps";
  if (opts.topIsAP || opts.heavyAP || opts.heavyCCBurst) return "Merc Treads";
  return "Ionian Boots of Lucidity";
}

export function getVolibearRec(
  tags: DraftTags,
  enemies: string[],
  enemyTop?: string
): ChampRec {
  const top = (enemyTop || "").trim();

  // Top-lane matchup buckets (normalized strings are passed from App)
  const TOP_RANGED = ["teemo", "vayne", "quinn", "kennen", "jayce", "gnar", "akshan"];
  const TOP_AP = ["teemo", "kennen", "mordekaiser", "gwen", "rumble", "vladimir", "cassiopeia"];
  const TOP_HEALING = ["aatrox", "fiora", "warwick", "darius", "vladimir", "illaoi"];
  const TOP_AUTO_AD = ["vayne", "quinn", "gnar", "tryndamere", "jax", "irelia", "yasuo", "yone"];

  const topIsRanged = !!top && TOP_RANGED.some((k) => top.includes(k));
  const topIsAP = !!top && TOP_AP.some((k) => top.includes(k));
  const topIsHealing = !!top && TOP_HEALING.some((k) => top.includes(k));
  const topIsAutoAD = !!top && TOP_AUTO_AD.some((k) => top.includes(k));

  // Enemy team threat hints (basic but practical)
  const CRIT_THREATS = ["jinx", "caitlyn", "tristana", "tryndamere", "yasuo", "yone", "aphelios"];
  const ONHIT_AA_THREATS = ["vayne", "kogmaw", "kai", "kaisa", "varus", "masteryi", "belveth", "jax", "irelia"];
  const critThreat = hasAny(enemies, CRIT_THREATS);
  const aaThreat = hasAny(enemies, ONHIT_AA_THREATS) || topIsAutoAD;

  // Runes + start (lane-focused)
  const runesLine = topIsRanged || tags.rangedTop
    ? "RUNES: Grasp + Second Wind (poke lane stability)"
    : "RUNES: PTA (kill pressure) or Grasp (matchup dependent)";

  const startLine = topIsRanged || tags.rangedTop
    ? "START: Doran’s Shield (don’t bleed out to poke)"
    : "START: Doran’s Blade (stronger all-in threat)";

  // Tear is extremely common in the “haste/tank” build path
  const tearLine =
    "TEAR: YES — buy Tear early (first base if possible) to enable Winter’s Approach timing";

  const boots = pickBoots({
    heavyAP: tags.heavyAP,
    heavyCCBurst: tags.heavyCCBurst,
    heavyAD: tags.heavyAD,
    topIsAP,
    topIsAutoAD,
  });

  // Lane rule (matchup based)
  const laneRule =
    topIsRanged || tags.rangedTop
      ? "LANE RULE: Stay healthy → let wave come → punish cooldowns → all-in windows after 6"
      : "LANE RULE: Short trades early → stack W mark → crash wave → look for dive window with R";

  // ---- Core 6 Build Logic (matchup + comp) ----
  //
  // Core identity we’re encoding:
  // - Winter’s Approach (Tear early) + haste boots (often Lucidity)
  // - Spirit Visage as a staple (especially with healing/shields)
  // - Frozen Heart / Unending Despair as common mid/late durability
  // - Randuin (crit) or Thornmail (healing) as targeted tech
  // - Riftmaker as a “damage/sustain closer” when you need to actually kill people
  //
  // We keep it deterministic and readable in champ select.

  const items: { name: string; note?: string }[] = [];

  // 1) Winter’s core (with Tear note)
  items.push({ name: "Winter’s Approach", note: "(buy Tear early → upgrades later)" });

  // 2) Boots slot
  items.push({ name: boots });

  // 3) Spirit Visage is a very consistent “core” item
  //    (especially good when you’re frontlining and W sustaining)
  items.push({
    name: "Spirit Visage",
    note: topIsAP || tags.heavyAP ? "(prioritize earlier vs AP)" : undefined,
  });

  // 4) Armor vs AA threats OR teamfight drain item
  if (aaThreat || tags.heavyAD) {
    items.push({ name: "Frozen Heart", note: "(huge vs auto attackers / AS)" });
  } else {
    items.push({ name: "Unending Despair", note: "(teamfight durability / drain)" });
  }

  // 5) Anti-heal or second durability slot
  if (tags.healing || topIsHealing) {
    items.push({ name: "Thornmail", note: "(anti-heal — component early if needed)" });
  } else if (items.some((x) => x.name === "Frozen Heart")) {
    items.push({ name: "Unending Despair" });
  } else {
    items.push({ name: "Frozen Heart", note: "(good default armor slot)" });
  }

  // 6) Final slot: crit tech or damage closer
  if (critThreat) {
    items.push({ name: "Randuin’s Omen", note: "(anti-crit / anti-burst)" });
  } else {
    items.push({
      name: "Riftmaker",
      note: "(if you need damage + long fights) — swap to more tank if behind",
    });
  }

  // Ensure “core 6” stays exactly 6 items
  const core6 = items.slice(0, 6);

  const fightRule =
    topIsRanged || tags.rangedTop
      ? "FIGHT RULE: Don’t force through poke — wait for their disengage/CC → R to disable tower / isolate target → W twice → reset zone"
      : "FIGHT RULE: Lead with Q-stun → drop E where fight will happen → W twice for sustain → R to turn dives / break towers";

  return {
    headlineLines: [runesLine, startLine, tearLine, laneRule],
    itemsOrdered: core6,
    fightRule,

    // Keep old fields populated (still useful if you ever want expandable details)
    runes: [
      topIsRanged || tags.rangedTop
        ? "Runes: Resolve (Grasp) + Second Wind + Unflinching"
        : "Runes: Precision (PTA) or Resolve (Grasp) depending on matchup",
      "Secondary: Precision (Triumph/Last Stand) or Sorcery for scaling",
    ],
    skillOrder: "Skill order: W > Q > E (take R whenever available).",
    starter: [startLine.replace("START: ", ""), "Summoners: Flash + Teleport (usually)"],
    coreItems: core6.map((x) => x.note ? `${x.name} ${x.note}` : x.name),
    situational: [
      "If lane has heavy healing: Bramble early (complete Thornmail later).",
      "If enemy comp has key CC chain: Mercs earlier + play around E zone.",
      "If you’re ahead and need damage: Riftmaker earlier can snowball.",
    ],
    notes: [
      "Tear early matters — it smooths mana/haste and makes your midgame fights feel much better.",
      topIsRanged || tags.rangedTop ? "Vs ranged: patience wins — don’t bleed HP for CS." : "",
    ].filter(Boolean),
  };
}
