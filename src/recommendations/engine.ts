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

type BuildContext = {
  tags: DraftTags;
  enemies: string[];
  top?: string;
  bot: string[];
};
// One registration point for each implemented champion's recommendation builder.
const BUILDERS: Record<ChampionKey, (context: BuildContext) => ChampRec> = {
  masteryi: (c) => getMasterYiRec(c.tags, c.enemies),
  belveth: (c) => getBelvethRec(c.tags, c.enemies),
  volibear: (c) => getVolibearRec(c.tags, c.enemies, c.top),
  heimerdinger: (c) => getHeimerdingerRec(c.tags, c.enemies, c.top),
  missfortune: (c) => getMissFortuneRec(c.tags, c.enemies, c.bot),
  lux: (c) => getLuxSupportRec(c.tags, c.enemies, c.bot),
};
export function analyzeDraft(draft: DraftSession, roster: DDragonChampion[]) {
  const { selected } = draft;
  const team = resolveChampions(splitTokens(draft.enemyRaw), roster);
  const top = resolveChampions(splitTokens(draft.enemyTopRaw), roster);
  const bot = resolveChampions(splitTokens(draft.enemyBotRaw), roster);
  const role = CHAMPIONS[selected].role;
  const lane =
    role === "Top"
      ? top.matched.slice(0, 1)
      : role === "ADC" || role === "Support"
        ? bot.matched.slice(0, 2)
        : [];
  const allEnemies = [...lane, ...team.matched].filter(
    (c, i, all) => all.findIndex((other) => other.id === c.id) === i,
  );
  const scoutChamps = allEnemies.slice(0, 5);
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
  });
  const baseline = BUILDERS[selected]({
    tags: getDraftTagsFromTraits([], roster),
    enemies: [],
    bot: [],
  });
  return {
    matched: team.matched,
    unmatched: team.unmatched,
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
