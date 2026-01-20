// src/recommendations/missFortune.ts
import type { DraftTags } from "./tags";
import type { ChampRec, OrderedItem } from "./masterYi";

function hasAny(list: string[], keys: string[]) {
  return list.some((e) => keys.some((k) => e.includes(k)));
}

function classifySupport(bot: string[]) {
  const ENGAGE = ["leona", "nautilus", "thresh", "blitzcrank", "rell", "alistar", "rakan", "pyke"];
  const POKE = ["lux", "xerath", "velkoz", "brand", "zyra"];
  const ENCHANT = ["lulu", "janna", "nami", "soraka", "milio", "karma", "yuumi"];

  const isEngage = hasAny(bot, ENGAGE);
  const isPoke = hasAny(bot, POKE);
  const isEnchant = hasAny(bot, ENCHANT);

  return { isEngage, isPoke, isEnchant };
}

function pickBoots(tags: DraftTags, enemies: string[]) {
  const HARD_CC = ["leona", "nautilus", "skarner", "malzahar", "lissandra", "vi", "ashe", "pantheon"];
  if (tags.heavyCCBurst || hasAny(enemies, HARD_CC)) return "Mercury’s Treads";
  if (tags.heavyAD) return "Plated Steelcaps";
  return "Berserker’s Greaves";
}

function needsQSS(enemies: string[]) {
  // MF: QSS is mostly for “I get point-clicked before/after R or I can’t DPS”
  const QSS_THREATS = ["malzahar", "skarner", "warwick", "lissandra"];
  return hasAny(enemies, QSS_THREATS);
}

export function getMissFortuneRec(
  tags: DraftTags,
  enemies: string[] = [],
  enemyBot: string[] = []
): ChampRec {
  const bot = enemyBot.slice(0, 2);
  const { isEngage, isPoke, isEnchant } = classifySupport(bot);

  // --- RUNES (crit-leaning default) ---
  // Common MF crit setups frequently use PTA for lane + midgame DPS;
  // we keep it deterministic and “parity-level” with your other champs.
  const runesLine = "RUNES: Press the Attack (crit/DPS) — lane wins off short trades + Q bounce";
  const secondaryLine = isEngage || tags.heavyCCBurst
    ? "SECONDARY: Inspiration (Biscuit + Cosmic) or Resolve (Second Wind) if lane is violent"
    : "SECONDARY: Inspiration (Biscuit + Cosmic) for lane control";

  // --- START + LANE RULE ---
  const starterLine =
    isPoke ? "START: Doran’s Shield (anti-poke lane stability)" : "START: Doran’s Blade (standard pressure)";

  const laneRule =
    isEngage
      ? "LANE RULE: Don’t stand in hook/engage range — thin wave, hold Flash, punish missed engage with Q+AA+E"
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
            "If they miss key engage: immediately step up for PTA trade and chunk them under your minion wave.",
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

  // --- ITEMS (crit build, ordered, with BUY HERE tech) ---
  const boots = pickBoots(tags, enemies);

  const items: OrderedItem[] = [];

  // MF crit core (deterministic, “champ select readable”)
  items.push({ name: "The Collector", note: "(snowball + execute for R cleanups)" });
  items.push({ name: boots });
  items.push({ name: "Infinity Edge", note: "(crit spike — R + autos hurt)" });

  // BUY HERE: QSS timing if suppression/lockdown exists
  if (needsQSS(enemies)) {
    items.splice(3, 0, { name: "QSS", note: "← BUY HERE (point/click suppression/lockdown)" });
  }

  // Armor pen / anti-frontline slot
  if (tags.tanky || tags.heavyAD) {
    items.push({ name: "Lord Dominik’s Regards", note: "(vs frontline / armor)" });
  } else {
    items.push({ name: "Lord Dominik’s Regards", note: "(best default 3–4 item damage curve)" });
  }

  // Sustain / safety slot
  items.push({
    name: "Bloodthirster",
    note: isPoke ? "(stabilize vs poke; keep HP for fights)" : "(shield lets you hold R angles)",
  });

  // Final slot: anti-heal or range/utility
  if (tags.healing) {
    items.push({ name: "Mortal Reminder", note: "(anti-heal — finish later; consider early Executioner’s)" });
  } else {
    items.push({ name: "Rapid Firecannon", note: "(safer autos to start fights / tag PTA)" });
  }

  const core6 = items.slice(0, 6);

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
      "Precision: Press the Attack | Presence of Mind | Legend: Bloodline/Alacrity | Coup de Grace",
      "Secondary: Inspiration (Biscuit + Cosmic) or Resolve (Second Wind) into hard lanes",
      "Shards: AS / Adaptive / (Armor or MR)",
    ],
    skillOrder: "Skill order: Q > W > E (take R whenever available).",
    starter: [starterLine.replace("START: ", ""), "Summoners: Flash + Heal (or Cleanse vs hard CC)"],
    coreItems: core6.map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      "If they have hard engage + you’re the wincon: early Stopwatch can save key midgame fights.",
      "If healing is high: Executioner’s early; complete Mortal later.",
      "If you can’t channel R safely: play more auto-focused and use R as follow-up only.",
    ],
    notes: [
      "Miss Fortune wins fights off position + timing. Your ult is your nuke—don’t donate it to point-click CC.",
      enemyBot.length ? `Bot matchup detected: ${enemyBot.slice(0, 2).join(", ")}` : "",
    ].filter(Boolean),
  };
}