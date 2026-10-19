import { hasAny } from "./shared";
// src/recommendations/heimerdinger.ts
import type { DraftTags } from "./tags";
import type { ChampRec, OrderedItem } from "./types";

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const TOP_RANGED = [
  "teemo",
  "quinn",
  "kennen",
  "jayce",
  "gnar",
  "vayne",
  "akshan",
];
const TOP_DIVERS = [
  "irelia",
  "camille",
  "jax",
  "riven",
  "renekton",
  "olaf",
  "tryndamere",
  "sett",
  "darius",
  "yasuo",
  "yone",
];
const TOP_SCALING = [
  "kayle",
  "nasus",
  "gangplank",
  "ornn",
  "sion",
  "mundo",
  "ksante",
  "vladimir",
];

function pickStart() {
  return "Doran's Ring";
}

export function getHeimerdingerRec(
  tags: DraftTags,
  enemies: string[] = [],
  enemyTop?: string,
  style: "auto" | "conqueror" | "comet" = "auto",
): ChampRec {
  // Reviewed top-lane baseline.
  const runeLine =
    style === "comet"
      ? "RUNES: Arcane Comet / Manaflow Band / Transcendence / Scorch (selected poke alternative)"
      : "RUNES: Conqueror / Presence of Mind / Legend: Haste / Cut Down (current popular top setup)";

  const top = norm(enemyTop || "");
  const topIsRanged = !!top && TOP_RANGED.some((k) => top.includes(k));
  const topIsDiver = !!top && TOP_DIVERS.some((k) => top.includes(k));
  const topIsScaling = !!top && TOP_SCALING.some((k) => top.includes(k));

  const start = pickStart();
  const startLine = `START: ${start} (lane control + mana)`;

  const laneRule =
    "LANE RULE: Turrets down before trades → hold E to punish engage → slow push + crash with turret setup";

  const waveTips = {
    title: topIsDiver
      ? "Anti-dive lane state"
      : topIsScaling
        ? "Perma-deny plan"
        : "Turret-nest tempo",
    bullets: [
      ...(topIsDiver
        ? [
            "Keep wave on your side (short lane) so dives are awkward; don’t perma-shove without vision.",
            "Build a 2-turret nest slightly behind your caster line; hold E for their commit (stun = turn).",
            "When you do shove: crash a big wave → ward → reset; don’t sit past river with no setup.",
          ]
        : topIsRanged
          ? [
              "Slow push behind turrets; don’t take free poke just to auto the wave.",
              "Crash on cannon wave for a safe reset/ward timing (turrets help you crash reliably).",
              "If you get chunked: stop shoving and let it bounce back—best fights happen when they walk into your setup.",
            ]
          : topIsScaling
            ? [
                "Slow push → crash big → freeze the bounce on your side to deny (they can’t farm safely into turrets).",
                "Punish last-hits with W poke; protect turret health so the lane stays ‘owned.’",
                "If ahead: stack waves and take plates—your setup makes plate trades favorable.",
              ]
            : [
                "Default: slow push with turrets → crash → take a clean reset/ward timing.",
                "Don’t randomly auto the wave—control it so fights happen where turrets already exist.",
                "If jungler is topside: stack a wave and threaten R+Q zone to win the crash/plates.",
              ]),
    ],
  };

  // Fix assassin detection: normalized enemies include “khazix”
  const needsZhonyas =
    tags.heavyAD ||
    tags.heavyCCBurst ||
    hasAny(enemies, [
      "zed",
      "talon",
      "naafiri",
      "khazix",
      "qiyana",
      "rengar",
      "vi",
    ]);

  // “BUY HERE” parity line (like Yi QSS timing)
  const stasisLine = needsZhonyas
    ? "STASIS: BUY HERE — Seeker’s Armguard before Zhonya’s if they can dive you (Zed/Vi/Kha etc.)"
    : "STASIS: Optional — rush Zhonya only if you’re getting hard-dived";

  const items: OrderedItem[] = [
    { name: "Blackfire Torch" },
    { name: "Sorcerer's Shoes" },
    { name: "Liandry's Torment" },
    {
      name: needsZhonyas ? "Zhonya's Hourglass" : "Rylai's Crystal Scepter",
      note: "Swap order for dive defense or kiting.",
    },
    { name: needsZhonyas ? "Rylai's Crystal Scepter" : "Zhonya's Hourglass" },
    {
      name: tags.tanky ? "Void Staff" : "Rabadon's Deathcap",
      note: "Choose Void Staff if MR is being built; frontline count alone cannot confirm MR.",
    },
  ];

  const fightRule =
    "FIGHT RULE: Don’t walk in first — set turrets, fish for E stun → R+E for picks or R+Q to hold a zone/objective";

  return {
    // 4 headline lines like Yi/Voli
    headlineLines: [runeLine, startLine, stasisLine, laneRule],
    waveTips,
    itemsOrdered: items.slice(0, 6),
    fightRule,
    bans: ["Irelia", "Yasuo", "Nasus", "Syndra", "Olaf"],

    runes: [
      style === "comet"
        ? "Sorcery: Arcane Comet / Manaflow Band / Transcendence / Scorch"
        : "Precision: Conqueror / Presence of Mind / Legend: Haste / Cut Down",
      style === "comet"
        ? "Precision: Presence of Mind / Legend: Haste"
        : "Sorcery: Absolute Focus / Gathering Storm",
      "Shards: Adaptive Force / Adaptive Force / Scaling Health",
    ],

    skillOrder: "Skill order: Q > W > E (take R whenever available).",
    starter: [start, "Flash + Ignite for pressure; Teleport for map coverage"],
    coreItems: items
      .slice(0, 6)
      .map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      "Arcane Comet is an alternative primary keystone for a poke-focused page; it replaces Conqueror rather than joining this page.",
      "If they have multiple divers: Zhonya earlier + play tighter around turret nests.",
      "If enemy stacks MR: Void Staff earlier (4th/5th).",
      "If you need perma-kite: Rylai earlier and use turrets as a slow field.",
    ],
    notes: [
      "Your power is pre-setup: fights are easiest when you own the space before they arrive.",
      tags.tanky
        ? "Burn items (Blackfire/Liandry) are extra valuable vs frontline."
        : "",
    ].filter(Boolean),
  };
}
