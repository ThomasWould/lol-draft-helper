// src/api/ddragon.ts
export type DDragonChampion = {
    id: string;          // "Aatrox"
    key: string;         // "266"
    name: string;        // "Aatrox"
    image: { full: string }; // "Aatrox.png"
    tags: string[];
    stats: {
    attackrange: number;
  };
  };

  export type ChampionMap = Record<string, DDragonChampion>;

  const DDRAGON = "https://ddragon.leagueoflegends.com";

  export async function fetchLatestDdragonVersion(): Promise<string> {
    const res = await fetch(`${DDRAGON}/api/versions.json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error("Failed to fetch versions.json");
    const versions: unknown = await res.json();
    if (!Array.isArray(versions) || typeof versions[0] !== 'string' || !/^\d+\.\d+\.\d+$/.test(versions[0])) {
      throw new Error('Invalid Data Dragon versions response');
    }
    return versions[0];
  }

  export async function fetchChampionMap(version: string): Promise<ChampionMap> {
    const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error("Failed to fetch champion.json");
    const json = await res.json();
    // json.data is { Aatrox: {...}, Ahri: {...} }
    if (!isChampionMap(json.data)) throw new Error('Invalid champion data');
    return json.data;
  }

  export function championIconUrl(version: string, imageFull: string): string {
    return `${DDRAGON}/cdn/${version}/img/champion/${imageFull}`;
  }

export function isChampionMap(value: unknown): value is ChampionMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.values(value);
  return entries.length > 0 && entries.every(c => c && typeof c.id === 'string' &&
    typeof c.name === 'string' && typeof c.key === 'string' && typeof c.image?.full === 'string' &&
    Array.isArray(c.tags) && c.tags.every((t: unknown) => typeof t === 'string') &&
    typeof c.stats?.attackrange === 'number' && Number.isFinite(c.stats.attackrange));
}

