// src/recommendations/championTraits.ts
import type { DDragonChampion } from "../api/ddragon";

export type DamageType = "AD" | "AP" | "MIXED";

export type ChampionTraits = {
  damage: DamageType;
  tanky: boolean;
  heavyCC: boolean;
  healing: boolean;
  ranged: boolean;
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Overrides for categories Riot doesn't reliably classify:
 * - heavyCC
 * - healing
 * - damage edge cases
 */
const OVERRIDES: Record<string, Partial<ChampionTraits>> = {
  // ---------------- Healing (big / reliable healing in kit) ----------------
  aatrox: { healing: true, damage: "AD" },
  warwick: { healing: true, damage: "MIXED" },
  soraka: { healing: true, damage: "AP" },
  yuumi: { healing: true, damage: "AP" },
  mundo: { healing: true, damage: "AD", tanky: true },
  drmundo: { healing: true, damage: "AD", tanky: true },
  vladimir: { healing: true, damage: "AP" },
  swain: { healing: true, damage: "AP" },
  fiora: { healing: true, damage: "AD" },
  illaoi: { healing: true, damage: "AD" },
  zac: { healing: true, damage: "AP", tanky: true },
  sona: { healing: true, damage: "AP" },
  nami: { healing: true, damage: "AP" },

  // ---------------- Heavy CC champs ----------------
  leona: { heavyCC: true },
  nautilus: { heavyCC: true },
  sejuani: { heavyCC: true, tanky: true },
  rammus: { heavyCC: true, tanky: true },
  lissandra: { heavyCC: true },
  vi: { heavyCC: true },
  amumu: { heavyCC: true, tanky: true },
  maokai: { heavyCC: true, tanky: true },
  alistar: { heavyCC: true, tanky: true },
  thresh: { heavyCC: true },
  blitzcrank: { heavyCC: true },
  skarner: { heavyCC: true, tanky: true },
  twistedfate: { heavyCC: true },
  malzahar: { heavyCC: true },
  pantheon: { heavyCC: true },
  galio: { heavyCC: true, tanky: true },

  // Damage profiles and reliable control that class tags miss.
  akali: { damage: "AP" },
  evelynn: { damage: "AP" },
  elise: { damage: "AP", heavyCC: true },
  ekko: { damage: "AP" },
  fizz: { damage: "AP" },
  katarina: { damage: "AP" },
  diana: { damage: "AP" },
  lillia: { damage: "AP", heavyCC: true },
  shyvana: { damage: "MIXED" },
  udyr: { damage: "MIXED" },
  volibear: { damage: "MIXED", healing: true, heavyCC: true },
  nunu: { damage: "AP", healing: true, heavyCC: true },
  sylas: { damage: "AP", healing: true },
  gragas: { damage: "AP", heavyCC: true },
  neeko: { damage: "AP", heavyCC: true },
  rell: { damage: "AP", heavyCC: true, tanky: true },
  braum: { damage: "AP", heavyCC: true, tanky: true },
  ornn: { damage: "MIXED", heavyCC: true, tanky: true },
  malphite: { damage: "AP", heavyCC: true, tanky: true },
  ashe: { damage: "AD", heavyCC: true },
  morgana: { damage: "AP", heavyCC: true },
  lux: { damage: "AP", heavyCC: true },
  renata: { damage: "AP", heavyCC: true },
  ambessa: { damage: "AD", healing: true, tanky: false },
  yunara: { damage: "MIXED", tanky: false },
  mel: { damage: "AP" },
  locke: { damage: "AP" },
  // Juggernauts may function as frontliners despite class tags.
  darius: { damage: "AD", tanky: true, healing: true },
  garen: { damage: "AD", tanky: true },
  sett: { damage: "AD", tanky: true },
  nasus: { damage: "AD", tanky: true, healing: true },
  aurelionsol: { damage: "AP" },

  // ---------------- Damage type outliers / mixed ----------------
  teemo: { damage: "AP" },
  kayle: { damage: "MIXED" },
  gwen: { damage: "AP" },
  mordekaiser: { damage: "AP" },
  corki: { damage: "AD" },
  kaisa: { damage: "MIXED" },
  kogmaw: { damage: "MIXED" },
  jax: { damage: "MIXED" },
};

/**
 * Infer AP/AD using Riot "tags" and a few role-based heuristics.
 * This isn't perfect, but overrides patch the important cases.
 */
function inferDamage(tags: string[]): DamageType {
  const t = tags.map((x) => x.toLowerCase());

  // Strong signals
  if (t.includes("marksman")) return "AD";
  if (t.includes("mage")) return "AP";

  // Usually AD
  if (t.includes("assassin")) return "AD";

  // Tank/Fighter are often mixed
  if (t.includes("tank") && t.includes("fighter")) return "MIXED";
  if (t.includes("fighter")) return "AD";
  if (t.includes("tank")) return "AP"; // many tanks deal magic damage; still acceptable for draft heuristics

  // Support is mixed but many are AP/utility
  if (t.includes("support")) return "AP";

  return "MIXED";
}

function inferTanky(tags: string[]) {
  const t = tags.map((x) => x.toLowerCase());
  return t.includes("tank");
}

function inferRanged(champ: DDragonChampion) {
  const range = champ.stats?.attackrange ?? 125;
  return range >= 300; // safe threshold: ranged autos
}

/**
 * Build map keyed by normalized champ id AND normalized champ name
 * so you can match either form.
 */
export function buildChampionTraitsMap(champs: DDragonChampion[]) {
  const map = new Map<string, ChampionTraits>();

  for (const c of champs) {
    const idKey = norm(c.id);
    const nameKey = norm(c.name);

    const base: ChampionTraits = {
      damage: inferDamage(c.tags || []),
      tanky: inferTanky(c.tags || []),
      heavyCC: false,
      healing: false,
      ranged: inferRanged(c),
    };

    // Apply override if exists
    const o = OVERRIDES[idKey] || OVERRIDES[nameKey];
    const merged: ChampionTraits = { ...base, ...(o || {}) };

    map.set(idKey, merged);
    map.set(nameKey, merged);
  }

  return map;
}
