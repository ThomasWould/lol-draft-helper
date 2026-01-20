// src/recommendations/lux.ts
import type { DraftTags } from "./tags";
import type { ChampRec, OrderedItem } from "./masterYi";

function hasAny(list: string[], keys: string[]) {
  return list.some((e) => keys.some((k) => e.includes(k)));
}

function classifyLane(bot: string[]) {
  const HOOK = ["thresh", "nautilus", "blitzcrank", "pyke"];
  const ENGAGE = ["leona", "rell", "alistar", "rakan"];
  const ENCHANT = ["lulu", "janna", "nami", "soraka", "milio", "yuumi", "karma"];
  const POKE_MAGES = ["xerath", "velkoz", "brand", "zyra", "lux"];

  const vsHook = hasAny(bot, HOOK);
  const vsEngage = hasAny(bot, ENGAGE) || vsHook;
  const vsEnchant = hasAny(bot, ENCHANT);
  const vsPoke = hasAny(bot, POKE_MAGES);

  return { vsHook, vsEngage, vsEnchant, vsPoke };
}

function needsZhonyas(enemies: string[]) {
  const DIVERS = ["zed", "talon", "naafiri", "khazix", "qiyana", "rengar", "vi", "nocturne"];
  return hasAny(enemies, DIVERS);
}

export function getLuxSupportRec(
  tags: DraftTags,
  enemies: string[] = [],
  enemyBot: string[] = []
): ChampRec {
  const bot = enemyBot.slice(0, 2);
  const { vsHook, vsEngage, vsEnchant, vsPoke } = classifyLane(bot);

  // --- RUNES ---
  const runeLine =
    "RUNES: Arcane Comet — Manaflow + Transcendence; Scorch for lane pressure";
  const secondaryLine =
    vsEngage || tags.heavyCCBurst
      ? "SECONDARY: Inspiration (Biscuit + Cosmic) — survive lanes + spam windows"
      : "SECONDARY: Inspiration (Biscuit + Cosmic) — standard Lux support";

  // --- START + LANE RULE ---
  const startLine = "START: World Atlas → upgrade support poke item (play for E poke + Q picks)";
  const laneRule =
    vsHook
      ? "LANE RULE: Stand behind minions — never give hook angle; trade only after hook misses"
      : vsEngage
        ? "LANE RULE: Respect all-in timers (lvl 2/3/6) — hold Q defensively, poke with E from max range"
        : vsEnchant
          ? "LANE RULE: Poke to force pots → look for Q when they step up to shield/heal"
          : "LANE RULE: Own brush + wave edge with E — fish Q when they dodge sideways";

  // --- WAVE TIPS (bot lane) ---
  const waveTips = {
    title: vsEngage ? "Wave safety vs all-in" : vsPoke ? "Trade space, not HP" : "Pick windows off wave",
    bullets: [
      ...(vsEngage
        ? [
            "Don’t perma-shove without vision—getting ganked with no Flash ends lane.",
            "Use E to thin the wave so you don’t get forced into a giant crash + dive.",
            "Hold Q for the engager’s commit; if they whiff engage, you get a free counter-trade.",
          ]
        : vsPoke
          ? [
              "Play slightly off-center so you don’t eat double poke; use E to contest brush control.",
              "Crash timings matter: help your ADC reset on cannon waves so you don’t get trapped low HP.",
              "Don’t spam E if it costs you lane control—poke only when it also wins space.",
            ]
          : [
              "Default: help slow push → crash → use the reset window to ward or roam mid with Q threat.",
              "Fight around your E zone: make them choose between CS and eating poke.",
              "When wave is neutral: threaten Q from fog/brush to force them back.",
            ]),
    ],
  };

  // --- ITEMS (support Lux) ---
  const needsStasis = needsZhonyas(enemies) || tags.heavyCCBurst;

  const items: OrderedItem[] = [];

  // Support item line
  items.push({ name: "Zaz'Zak’s Realmspike", note: "(support poke upgrade)" });

  // Boots
  items.push({ name: "Sorcerer’s Shoes", note: "(lane pressure / pick damage)" });

  // Core AP support path
  items.push({ name: "Imperial Mandate", note: "(Q/E slow + team follow-up damage)" });

  if (needsStasis) {
    items.push({ name: "Zhonya’s Hourglass", note: "← BUY HERE (divers/CC — survive focus)" });
  } else {
    items.push({ name: "Horizon Focus", note: "(pick damage amplification off Q/slow)" });
  }

  // Anti-heal / pen / utility
  if (tags.healing) {
    items.push({ name: "Morellonomicon", note: "(anti-heal — grab Oblivion Orb earlier if needed)" });
  } else {
    items.push({ name: "Rabadon’s Deathcap", note: "(if you’re snowballing/picking constantly)" });
  }

  items.push({
    name: tags.tanky ? "Void Staff" : "Shadowflame",
    note: tags.tanky ? "(if they build MR/frontline)" : "(best damage if low MR)",
  });

  const core6 = items.slice(0, 6);

  const bans = ["Blitzcrank", "Nautilus", "Leona", "Pyke", "Zed"];

  const fightRule =
    vsEngage || tags.heavyCCBurst
      ? "FIGHT RULE: Play as 2nd line — Q whoever commits → E zone to slow → R to finish (don’t walk up first)"
      : "FIGHT RULE: Fish Q from fog/angles → layer E slow → R to convert pick into objective";

  return {
    headlineLines: [runeLine, secondaryLine, startLine, laneRule],
    waveTips,
    itemsOrdered: core6,
    fightRule,
    bans,

    runes: [
      "Sorcery: Arcane Comet | Manaflow Band | Transcendence | Scorch",
      "Secondary: Inspiration (Biscuit + Cosmic Insight)",
      "Shards: Adaptive / Adaptive / Health",
    ],
    skillOrder: "Skill order: E > Q > W (take R whenever available).",
    starter: ["World Atlas", "2x Pots", "Summoners: Flash + (Ignite/Exhaust) depending on lane"],
    coreItems: core6.map((x) => (x.note ? `${x.name} ${x.note}` : x.name)),
    situational: [
      "If they hard-dive: Zhonya earlier (even 2nd/3rd) + play tighter to your team.",
      "If your comp needs picks: prioritize Mandate/Horizon-style damage amp.",
      "If they stack MR: Void Staff earlier (4th/5th).",
    ],
    notes: [
      "Lux support wins by owning space with E and converting one Q into a pick → objective.",
      bot.length ? `Bot matchup detected: ${bot.join(", ")}` : "",
    ].filter(Boolean),
  };
}