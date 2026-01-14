// src/api/ddragon.ts
export type DDragonChampion = {
    id: string;          // "Aatrox"
    key: string;         // "266"
    name: string;        // "Aatrox"
    image: { full: string }; // "Aatrox.png"
  };
  
  export type ChampionMap = Record<string, DDragonChampion>;
  
  const DDRAGON = "https://ddragon.leagueoflegends.com";
  
  export async function fetchLatestDdragonVersion(): Promise<string> {
    const res = await fetch(`${DDRAGON}/api/versions.json`);
    if (!res.ok) throw new Error("Failed to fetch versions.json");
    const versions: string[] = await res.json();
    return versions[0]; // latest
  }
  
  export async function fetchChampionMap(version: string): Promise<ChampionMap> {
    const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`);
    if (!res.ok) throw new Error("Failed to fetch champion.json");
    const json = await res.json();
    // json.data is { Aatrox: {...}, Ahri: {...} }
    return json.data as ChampionMap;
  }
  
  export function championIconUrl(version: string, imageFull: string): string {
    return `${DDRAGON}/cdn/${version}/img/champion/${imageFull}`;
  }
  