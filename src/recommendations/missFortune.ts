// src/recommendations/missFortune.ts
import type { DraftTags } from "./tags";
import type { ChampRec, OrderedItem } from "./types";
import { hasAny, carryBoots, cleanseAdvice, withCleanse } from "./shared";


function classifySupport(bot: string[]) {
  const ENGAGE = ["leona", "nautilus", "thresh", "blitzcrank", "rell", "alistar", "rakan", "pyke"];
  const POKE = ["lux", "xerath", "velkoz", "brand", "zyra"];
  const ENCHANT = ["lulu", "janna", "nami", "soraka", "milio", "karma", "yuumi"];

  const isEngage = hasAny(bot, ENGAGE);
  const isPoke = hasAny(bot, POKE);
  const isEnchant = hasAny(bot, ENCHANT);

  return { isEngage, isPoke, isEnchant };
}



export function getMissFortuneRec(
  tags: DraftTags,
  enemies: string[] = [],
  enemyBot: string[] = []
): ChampRec {
  const bot = enemyBot.slice(0, 2);
  const { isEngage, isPoke, isEnchant } = classifySupport(bot);

  const runesLine = isPoke
    ? "RUNES: Press the Attack — sustained trading alternative when poke denies First Strike"
    : "RUNES: First Strike / Cash Back / Biscuit Delivery / Jack of All Trades";
  const secondaryLine = "SECONDARY: Manaflow Band + Gathering Storm; PTA alternative uses Inspiration.";

  // --- START + LANE RULE ---
  const starterLine =
    isPoke ? "START: Doran’s Shield (anti-poke lane stability)" : "START: Doran’s Blade (standard pressure)";

  const laneRule =
    isEngage
      ? "LANE RULE: Don’t stand in hook/engage range — thin wave, hold Flash, punish missed engage with AA+Q; use E only when its slow adds value"
      : isEnchant
        ? "LANE RULE: Trade often before they out-sustain — Q bounce poke + wave control into plate windows"
        : "LANE RULE: Slow push → crash → reset (you want wave control for clean Q bounces + E zones)";

  // --- WAVE TIPS (bot lane) ---
  const waveTips = {
    title: isEngage ? "Keep wave safe vs engage" : isPoke ? "Stabilize vs poke" : "Crash timing for plates",
    bullets: [
      ...(isEngage
        ? [
            "Levels 1–3: don’t perma-push into hook angles; keep wave near your side so engages are risky for them.",
            "If they miss key engage: immediately step up for short trade and chunk them under your minion wave.",
            "Crash a cannon wave only when you have vision/HP—otherwise keep the lane short and safe.",
          ]
        : isPoke
          ? [
              "Let wave come slightly toward you; last-hit more than you shove so you don’t tank free poke in a long lane.",
              "Use E to break freezes and to set up Q bounce trades (don’t spam it off-CD if mana is tight).",
              "Crash on cannon wave → reset → return before you lose tempo.",
            ]
          : [
              "Default: slow push 1–2 waves → crash big → take recall/ward timing.",
              "When you have item lead: perma-crash to pressure plates and set up dragon timers.",
              "If jungle is bot-side: stack wave to force them to choose between CS and fighting in your minion wave.",
            ]),
    ],
  };

  const base: OrderedItem[] = [
    { name: "Hubris" }, { name: carryBoots(tags, 'Boots of Swiftness') },
    { name: "The Collector" }, { name: "Infinity Edge" },
    { name: tags.healing ? "Mortal Reminder" : "Lord Dominik's Regards", note: "One Last Whisper upgrade only; swap to Mortal Reminder when anti-heal is needed." },
    { name: isPoke ? "Bloodthirster" : "Rapid Firecannon" },
  ];
  const core6 = withCleanse(base, enemies);

  // --- BANS + FIGHT RULE ---
  const bans = ["Leona", "Nautilus", "Rammus", "Malphite", "Zac"];

  const fightRule =
    tags.heavyCCBurst || isEngage
      ? "FIGHT RULE: Don’t R first — wait for engage/CC to be used → E slow + R from safe angle → clean up with crit autos"
      : "FIGHT RULE: Use E to set zone → R when targets can’t sidestep/interrupt → then auto to finish";

  return {
    headlineLines: [runesLine, secondaryLine, starterLine, laneRule],
    waveTips,
    itemsOrdered: core6,
    fightRule,
    bans,

    // keep long fields populated (optional future expand)
    runes: [
      isPoke ? "Precision: Press the Attack / Presence of Mind / Legend: Bloodline / Coup de Grace" : "Inspiration: First Strike / Cash Back / Biscuit Delivery / Jack of All Trades",
      isPoke ? "Inspiration: Biscuit Delivery / Cosmic Insight" : "Sorcery: Manaflow Band / Gathering Storm",
      "Shards: Adaptive Force / Adaptive Force / Health",
    ],

    skillOrder: "Skill order: Q > W > E (take R whenever available).",
    starter: [starterLine.replace("START: ", ""), "Flash + Barrier; Cleanse against removable CC (not suppression)"],
    coreItems: core6.map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      cleanseAdvice,
      "If healing is high: Executioner’s early; complete Mortal later.",
      "If you can’t channel R safely: play more auto-focused and use R as follow-up only.",
    ],
    notes: [
      "Miss Fortune wins fights off position + timing. Your ult is your nuke—don’t donate it to point-click CC.",
      enemyBot.length ? `Bot matchup detected: ${enemyBot.slice(0, 2).join(", ")}` : "",
    ].filter(Boolean),
  };
}