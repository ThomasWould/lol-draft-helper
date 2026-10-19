// Refreshing Data Dragon does not update curated recommendations.
export const META = {
  patch: "26.20", dataVersion: "16.20.1", reviewedAt: "2026-10-18",
  scope: "Summoner's Rift • Ranked Solo/Duo • Emerald+ • All regions",
  patchUrl: "https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-20-notes/",
} as const;
export const CHAMPIONS = {
  masteryi: { label: "Master Yi", role: "Jungle", source: "https://mobalytics.gg/lol/champions/masteryi/build" },
  belveth: { label: "Bel'Veth", role: "Jungle", source: "https://mobalytics.gg/lol/champions/belveth/build" },
  volibear: { label: "Volibear", role: "Top", source: "https://mobalytics.gg/lol/champions/volibear/build/top" },
  heimerdinger: { label: "Heimerdinger", role: "Top", source: "https://mobalytics.gg/lol/champions/heimerdinger/build/top" },
  missfortune: { label: "Miss Fortune", role: "ADC", source: "https://mobalytics.gg/lol/champions/missfortune/build" },
  lux: { label: "Lux", role: "Support", source: "https://mobalytics.gg/lol/champions/lux/build/support" },
} as const;
export type ChampionKey = keyof typeof CHAMPIONS;
export function matchesReviewedPatch(version: string) {
  return version.split('.').slice(0, 2).join('.') === META.dataVersion.split('.').slice(0, 2).join('.');
}
