// src/recommendations/tags.ts
import type { DDragonChampion } from "../api/ddragon";
import { buildChampionTraitsMap } from "./championTraits";

export type DraftTags = {
  tanky: boolean;
  heavyCCBurst: boolean;
  heavyAP: boolean;
  heavyAD: boolean;
  healing: boolean;
  rangedTop: boolean;
  counts: {
    tanks: number;
    ccBurst: number;
    ap: number;
    ad: number;
    healing: number;
  };
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * NEW: tag enemies based on champion traits map (full roster coverage).
 */
export function getDraftTagsFromTraits(
  enemies: string[],
  championList: DDragonChampion[],
  enemyTop?: string
): DraftTags {
  const traitsMap = buildChampionTraitsMap(championList);

  const enemyIds = enemies.map(norm);

  let tanks = 0;
  let ccBurst = 0;
  let ap = 0;
  let ad = 0;
  let healing = 0;

  for (const e of enemyIds) {
    const t = traitsMap.get(e);
    if (!t) continue;

    if (t.tanky) tanks += 1;
    if (t.heavyCC) ccBurst += 1;
    if (t.healing) healing += 1;

    if (t.damage === "AP") ap += 1;
    else if (t.damage === "AD") ad += 1;
    else {
      // MIXED: count as half and half (or choose one side)
      ap += 0.5;
      ad += 0.5;
    }
  }

  // top ranged detection
  const topNorm = norm(enemyTop || "");
  const topTraits = traitsMap.get(topNorm);
  const rangedTop = !!topNorm && !!topTraits?.ranged;

  const heavyAP = ap >= 3 && ap > ad;
  const heavyAD = ad >= 3 && ad > ap;

  return {
    tanky: tanks >= 2,
    heavyCCBurst: ccBurst >= 2,
    heavyAP,
    heavyAD,
    healing: healing >= 1,
    rangedTop,
    counts: {
      tanks: Math.round(tanks),
      ccBurst: Math.round(ccBurst),
      ap: Math.round(ap),
      ad: Math.round(ad),
      healing: Math.round(healing),
    },
  };
}

// keep your pills helper
export function tagsToPills(tags: DraftTags): string[] {
  const pills: string[] = [];
  if (tags.tanky) pills.push("2+ tanks");
  if (tags.heavyCCBurst) pills.push("burst + CC");
  if (tags.heavyAP) pills.push("heavy AP");
  if (tags.heavyAD) pills.push("heavy AD");
  if (tags.healing) pills.push("healing");
  if (tags.rangedTop) pills.push("ranged top");
  return pills;
}
