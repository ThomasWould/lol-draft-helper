import type { DDragonChampion } from "../api/ddragon";
import { normalizeLoose, resolveChampions, splitTokens } from "../draft";
import { CHAMPIONS, type ChampionKey } from "./meta";
import { getMasterYiRec } from "./masterYi";
import { getBelvethRec } from "./belveth";
import { getVolibearRec } from "./volibear";
import { getHeimerdingerRec } from "./heimerdinger";
import { getMissFortuneRec } from "./missFortune";
import { getLuxSupportRec } from "./lux";
import { getDraftTagsFromTraits, type DraftTags } from "./tags";
import type { ChampRec } from "./types";
import type { DraftSession } from "../draftSession";
import { supportsBuildStyle, type BuildStyle } from "./styles";
import { analyzeTeam } from "./team";

type BuildContext = {
  tags: DraftTags;
  enemies: string[];
  top?: string;
  bot: string[];
  style: BuildStyle;
};
// One registration point for each implemented champion's recommendation builder.
const BUILDERS: Record<ChampionKey, (context: BuildContext) => ChampRec> = {
  masteryi: (c) =>
    getMasterYiRec(
      c.tags,
      c.enemies,
      c.style === "crit" || c.style === "onhit" ? c.style : "auto",
    ),
  belveth: (c) =>
    getBelvethRec(
      c.tags,
      c.enemies,
      c.style === "pta" || c.style === "tempo" ? c.style : "auto",
    ),
  volibear: (c) => getVolibearRec(c.tags, c.enemies, c.top),
  heimerdinger: (c) =>
    getHeimerdingerRec(
      c.tags,
      c.enemies,
      c.top,
      c.style === "comet" || c.style === "conqueror" ? c.style : "auto",
    ),
  missfortune: (c) =>
    getMissFortuneRec(
      c.tags,
      c.enemies,
      c.bot,
      c.style === "pta" || c.style === "firststrike" ? c.style : "auto",
    ),
  lux: (c) => getLuxSupportRec(c.tags, c.enemies, c.bot),
};
export function analyzeDraft(draft: DraftSession, roster: DDragonChampion[]) {
  const { selected } = draft;
  const enemyInput = resolveChampions(splitTokens(draft.enemyRaw), roster);
  const top = resolveChampions(splitTokens(draft.enemyTopRaw), roster);
  const bot = resolveChampions(splitTokens(draft.enemyBotRaw), roster);
  const role = CHAMPIONS[selected].role;
  const lane =
    role === "Top"
      ? top.matched.slice(0, 1)
      : role === "ADC" || role === "Support"
        ? bot.matched.slice(0, 2)
        : [];
  const allEnemies = [...lane, ...enemyInput.matched].filter(
    (c, i, all) => all.findIndex((other) => other.id === c.id) === i,
  );
  const scoutChamps = allEnemies.slice(0, 5);
  const allyInput = resolveChampions(
    splitTokens(draft.alliesRaw ?? ""),
    roster,
  );
  const allyConflicts = allyInput.matched.filter((c) =>
    scoutChamps.some((enemy) => enemy.id === c.id),
  );
  const eligibleAllies = allyInput.matched.filter(
    (c) =>
      normalizeLoose(c.name) !== selected &&
      !allyConflicts.some((conflict) => conflict.id === c.id),
  );
  const teammates = eligibleAllies.slice(0, 4);
  const team = analyzeTeam(selected, teammates, roster);
  const style = supportsBuildStyle(selected, draft.buildStyle)
    ? draft.buildStyle
    : "auto";
  const enemyNamesNormalized = scoutChamps.map((c) => normalizeLoose(c.name));
  const activeTop = role === "Top" ? lane[0] : undefined;
  const enemyTopNormalized = activeTop ? normalizeLoose(activeTop.name) : "";
  const enemyBotNormalized =
    role === "ADC" || role === "Support"
      ? lane.map((c) => normalizeLoose(c.name))
      : [];
  const tags = getDraftTagsFromTraits(
    enemyNamesNormalized,
    roster,
    enemyTopNormalized || undefined,
  );
  const rec = BUILDERS[selected]({
    tags,
    enemies: enemyNamesNormalized,
    top: enemyTopNormalized || undefined,
    bot: enemyBotNormalized,
    style,
  });
  const baseline = BUILDERS[selected]({
    tags: getDraftTagsFromTraits([], roster),
    enemies: [],
    bot: [],
    style,
  });
  return {
    matched: enemyInput.matched,
    unmatched: enemyInput.unmatched,
    topMatched: top.matched,
    topUnmatched: top.unmatched,
    botMatched: bot.matched,
    botUnmatched: bot.unmatched,
    allEnemies,
    scoutChamps,
    enemyNamesNormalized,
    activeTop,
    enemyTopNormalized,
    enemyBotNormalized,
    tags,
    rec,
    baseline,
    teammates,
    team,
    allyUnmatched: allyInput.unmatched,
    allyConflicts,
    allyOverflow: eligibleAllies.length > 4,
    style,
  };
}

export function comparePlans(baseline: ChampRec, adapted: ChampRec) {
  return {
    items: adapted.itemsOrdered.flatMap((item, index) => {
      const before = baseline.itemsOrdered[index];
      return before && normalizeLoose(before.name) !== normalizeLoose(item.name)
        ? [
            {
              slot: index + 1,
              before: before.name,
              after: item.name,
              note: item.note,
            },
          ]
        : [];
    }),
    runesChanged: baseline.runes.join("\n") !== adapted.runes.join("\n"),
    startChanged: baseline.starter.join("\n") !== adapted.starter.join("\n"),
  };
}
