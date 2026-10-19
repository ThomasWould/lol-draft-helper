import { hasAny } from "./shared";
// src/recommendations/volibear.ts
import type { DraftTags } from "./tags";
import type { ChampRec } from "./types";


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
  if (opts.topIsAP || opts.heavyAP) return "Mercury’s Treads";
  return "Ionian Boots of Lucidity";
}

function pickStart(opts: {
  topIsRanged: boolean;
  topIsAP: boolean;
  topIsAutoAD: boolean;
  heavyCCBurst: boolean;
}) {
  // Default (most common / best general): Ring
  // Shield: only if you’re going to get poked out / bled down by range
  // Blade: only if you’re hard committing to early melee scrap + snowball

  if (opts.topIsRanged) return "Doran’s Shield";
  if (opts.heavyCCBurst && opts.topIsAutoAD) return "Doran’s Shield"; // safety into nasty all-in + CC
  if (!opts.topIsAP && opts.topIsAutoAD) return "Doran’s Blade"; // melee AA duel lanes (Trynd/Jax/Irelia-ish)
  return "Doran’s Ring";
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
  const TOP_ALLIN = ["darius", "olaf", "sett", "renekton", "trundle", "mordekaiser", "illaoi", "warwick"];
  const TOP_SCALING = ["kayle", "nasus", "gangplank", "vladimir", "ksante", "ornn", "sion", "mundo"];


  const topIsRanged = !!top && TOP_RANGED.some((k) => top.includes(k));
  const topIsAP = !!top && TOP_AP.some((k) => top.includes(k));
  const topIsHealing = !!top && TOP_HEALING.some((k) => top.includes(k));
  const topIsAutoAD = !!top && TOP_AUTO_AD.some((k) => top.includes(k));
  const topIsAllIn = !!top && TOP_ALLIN.some((k) => top.includes(k));
  const topIsScaling = !!top && TOP_SCALING.some((k) => top.includes(k));


  // Enemy team threat hints (basic but practical)
  const CRIT_THREATS = ["jinx", "caitlyn", "tristana", "tryndamere", "yasuo", "yone", "aphelios"];
  const ONHIT_AA_THREATS = ["vayne", "kogmaw", "kaisa", "varus", "masteryi", "belveth", "jax", "irelia"];
  const critThreat = hasAny(enemies, CRIT_THREATS);
  const aaThreat = hasAny(enemies, ONHIT_AA_THREATS) || topIsAutoAD;

  // Runes + start (lane-focused)
  const runesLine = topIsRanged || tags.rangedTop
    ? "RUNES: Lethal Tempo + Second Wind / Revitalize (ranged-lane adjustment)"
    : "RUNES: Lethal Tempo / Triumph / Legend: Haste / Last Stand";

  const startItem = pickStart({
  topIsRanged: topIsRanged || tags.rangedTop,
  topIsAP,
  topIsAutoAD,
  heavyCCBurst: tags.heavyCCBurst,
});

const startLine =
  startItem === "Doran’s Shield"
    ? "START: Doran’s Shield (don’t bleed out to poke)"
    : startItem === "Doran’s Blade"
      ? "START: Doran’s Blade (melee all-in pressure)"
      : "START: Doran’s Ring (most common — mana + lane control)";

  // Reviewed bruiser baseline; Fimbulwinter remains a separate alternative.
  const tearLine =
    "BUILD: Dusk and Dawn → Navori Flickerblade; Tear is optional for a separate Fimbulwinter tank path.";

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

    const waveTips = {
    title:
      topIsRanged || tags.rangedTop
        ? "Let it push → bounce → punish"
        : topIsAllIn
          ? "Keep wave short lane early"
          : topIsScaling
            ? "Bounce into freeze to deny"
            : "Standard Voli tempo",
    bullets: [
      ...(topIsRanged || tags.rangedTop
        ? [
            "Levels 1–3: last-hit only; let wave come to you so you don’t eat free poke in a long lane.",
            "When it crashes: trim the bounce and look to freeze near tower (forces them to overextend).",
            "Hard shove only to crash a cannon wave → reset/ward → return to a safer lane state.",
          ]
        : topIsAllIn
          ? [
              "Early: keep wave on your side (short lane) so you don’t get run down.",
              "Thin stacked waves—don’t fight into 2–3 waves (minion damage loses trades).",
              "Crash cannon wave when you need a reset; otherwise hold freeze and punish oversteps with Q+E zone.",
            ]
          : topIsScaling
            ? [
                "Slow push 1–2 waves → crash big → let it bounce back (sets up your freeze).",
                "Freeze near tower to deny XP/CS; ping jungle when they must walk up to break it.",
                "After 6: stack a wave to threaten dive/plate windows with R on the crash.",
              ]
            : [
                "Default: short trades → build a slow push → crash to get a clean reset/ward timing.",
                "Avoid perma-shoving past river without vision; keep wave controllable.",
                "After 6: stack waves to create dive/plate windows, or freeze to deny and force mistakes.",
              ]),
    ],
  };

  const items = [
    { name: "Dusk and Dawn", note: "Spellblade bruiser core; do not stack other Spellblade items." },
    { name: boots },
    { name: "Navori Flickerblade", note: "Ability uptime through attacks; requires access to a target." },
    { name: tags.heavyAD && !topIsAP ? "Frozen Heart" : "Spirit Visage", note: "Adapt this resistance slot to the actual damage reaching you." },
    { name: tags.healing || topIsHealing ? "Thornmail" : critThreat ? "Randuin's Omen" : aaThreat ? "Frozen Heart" : "Unending Despair" },
    { name: "Jak'Sho, The Protean" },
  ];
  // Avoid duplicate Frozen Heart when both lane and composition select armor.
  if (items[3].name === items[4].name) items[4] = { name: "Unending Despair" };
  const core6 = items;

  const fightRule =
    topIsRanged || tags.rangedTop
      ? "FIGHT RULE: Don’t force through poke — wait for their disengage/CC → R to disable tower / isolate target → W twice → reset zone"
      : "FIGHT RULE: Lead with Q-stun → drop E where fight will happen → W twice for sustain → R to turn dives / break towers";

  return {
    headlineLines: [runesLine, startLine, tearLine, laneRule],
    waveTips,
    itemsOrdered: core6,
    fightRule,
    bans: ["Teemo", "Urgot", "Dr. Mundo", "Kennen", "Vayne"],
    // Full details are available in the recommendation card.
    runes: [
      "Precision: Lethal Tempo / Triumph / Legend: Haste / Last Stand",
      topIsRanged ? "Resolve: Second Wind / Revitalize" : "Resolve: Demolish / Revitalize",
      "Shards: Attack Speed / Adaptive Force / Scaling Health",
    ],

    skillOrder: "Skill order: W > Q > E (take R whenever available).",
    starter: [startLine.replace("START: ", ""), "Summoners: Flash + Teleport (usually)"],
    coreItems: core6.map((x) => x.note ? `${x.name} ${x.note}` : x.name),
    situational: [
      "Bramble/Thornmail anti-heal requires the enemy to attack you; it will not reliably debuff a healer standing behind them.",
      "Mercury’s Treads help versus reducible CC and magic damage; they do not shorten knockups or suppression. Play around your E zone.",
      "If you’re ahead and need damage: Riftmaker earlier can snowball.",
    ],
    notes: [
      "Tear is not mandatory for this build. Buy it only when deliberately choosing a Fimbulwinter tank alternative.",
      topIsRanged || tags.rangedTop ? "Vs ranged: patience wins — don’t bleed HP for CS." : "",
    ].filter(Boolean),
  };
}
