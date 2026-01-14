// src/recommendations/tags.ts
export type DraftTagCounts = {
  tanks: number;
  ccBurst: number;
  ap: number;
  ad: number;
  healing: number;
};

export type DraftTags = {
  tanky: boolean;
  heavyCCBurst: boolean;
  heavyAP: boolean;
  heavyAD: boolean;
  healing: boolean;
  rangedTop: boolean; // mostly for Voli matchups

  // NEW: numeric breakdown for UI/logic
  counts: DraftTagCounts;
};

function norm(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const TANKY = [
  "mundo",
  "ornn",
  "sion",
  "zac",
  "sejuani",
  "rammus",
  "malphite",
  "chogath",
  "cho gath",
  "tahm",
  "tahm kench",
  "ksante",
  "shen",
  "poppy",
  "galio",
  "mordekaiser",
];

const CC_BURST = [
  "annie",
  "lissandra",
  "leona",
  "nautilus",
  "rengar",
  "khazix",
  "kha zix",
  "vi",
  "syndra",
  "zed",
  "fizz",
  "diana",
  "malzahar",
  "skarner",
  "twisted fate",
  "pantheon",
];

const HEALING = [
  "soraka",
  "yuumi",
  "mundo",
  "aatrox",
  "vladimir",
  "swain",
  "warwick",
  "fiora",
  "red kayn",
  "rhaast",
  "nami",
  "sona",
];

const RANGED_TOP = ["teemo", "vayne", "quinn", "kennen", "jayce", "gnar", "akshan"];

const AP_HINTS = [
  "ahri",
  "annie",
  "brand",
  "cassiopeia",
  "diana",
  "ekko",
  "fizz",
  "katarina",
  "kennen",
  "lissandra",
  "malzahar",
  "orianna",
  "syndra",
  "veigar",
  "vex",
  "vladimir",
  "xerath",
  "zoe",
  "zyra",
];

const AD_HINTS = [
  "caitlyn",
  "draven",
  "ezreal",
  "jinx",
  "kaisa",
  "lucian",
  "miss fortune",
  "samira",
  "tristana",
  "vayne",
  "yasuo",
  "yone",
  "zed",
  "talon",
  "kayn",
  "rengar",
  "khazix",
  "kha zix",
  "darius",
];

function countMatches(enemies: string[], keywords: string[]) {
  const eNorm = enemies.map(norm);
  const kNorm = keywords.map(norm);
  return eNorm.filter((e) => kNorm.some((k) => e.includes(k))).length;
}

export function getDraftTags(enemies: string[], enemyTop?: string): DraftTags {
  const tanks = countMatches(enemies, TANKY);
  const ccBurst = countMatches(enemies, CC_BURST);
  const ap = countMatches(enemies, AP_HINTS);
  const ad = countMatches(enemies, AD_HINTS);
  const healing = countMatches(enemies, HEALING);

  const top = norm(enemyTop || "");
  const rangedTop = !!top && RANGED_TOP.map(norm).some((r) => top.includes(r));

  return {
    tanky: tanks >= 2,
    heavyCCBurst: ccBurst >= 2,
    heavyAP: ap >= 3 && ap > ad,
    heavyAD: ad >= 3 && ad > ap,
    healing: healing >= 1,
    rangedTop,

    counts: { tanks, ccBurst, ap, ad, healing },
  };
}

/**
 * NEW: includes counts by default, but you can turn it off if you want cleaner pills.
 */
export function tagsToPills(tags: DraftTags, opts?: { showCounts?: boolean }): string[] {
  const showCounts = opts?.showCounts ?? true;
  const pills: string[] = [];

  if (tags.tanky) pills.push(showCounts ? `2+ tanks (${tags.counts.tanks})` : "2+ tanks");
  if (tags.heavyCCBurst) pills.push(showCounts ? `burst + CC (${tags.counts.ccBurst})` : "burst + CC");
  if (tags.heavyAP) pills.push(showCounts ? `heavy AP (${tags.counts.ap})` : "heavy AP");
  if (tags.heavyAD) pills.push(showCounts ? `heavy AD (${tags.counts.ad})` : "heavy AD");
  if (tags.healing) pills.push(showCounts ? `healing (${tags.counts.healing})` : "healing");
  if (tags.rangedTop) pills.push("ranged top");

  return pills;
}
