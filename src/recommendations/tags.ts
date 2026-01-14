// src/recommendations/tags.ts
export type DraftTags = {
    tanky: boolean;
    heavyCCBurst: boolean;
    heavyAP: boolean;
    heavyAD: boolean;
    healing: boolean;
    rangedTop: boolean; // mostly for Voli matchups
  };
  
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
    return enemies.filter((e) => keywords.some((k) => e.includes(k))).length;
  }
  
  export function getDraftTags(enemies: string[], enemyTop?: string): DraftTags {
    const tankCount = countMatches(enemies, TANKY);
    const ccBurstCount = countMatches(enemies, CC_BURST);
    const apCount = countMatches(enemies, AP_HINTS);
    const adCount = countMatches(enemies, AD_HINTS);
    const healCount = countMatches(enemies, HEALING);
  
    const top = (enemyTop || "").trim();
    const rangedTop = !!top && RANGED_TOP.some((r) => top.includes(r));
  
    return {
      tanky: tankCount >= 2,
      heavyCCBurst: ccBurstCount >= 2,
      heavyAP: apCount >= 3 && apCount > adCount,
      heavyAD: adCount >= 3 && adCount > apCount,
      healing: healCount >= 1,
      rangedTop,
    };
  }
  
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
  