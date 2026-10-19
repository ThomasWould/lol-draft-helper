import { useEffect, useMemo, useState } from 'react';
import { fetchChampionMap, fetchLatestDdragonVersion, isChampionMap, type ChampionMap } from '../api/ddragon';
import bundledChampions from '../data/champions.json';
import { META } from '../recommendations/meta';

const CACHE_KEY = 'ddragon_champs_v2';
type Cache = { version: string; champMap: ChampionMap; savedAt: number };
function readCache(): Cache | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return parsed && /^\d+\.\d+\.\d+$/.test(parsed.version) && isChampionMap(parsed.champMap) &&
      typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt) &&
      parsed.savedAt > 0 && parsed.savedAt <= Date.now() ? parsed : null;
  } catch { return null; }
}

export function useChampionData() {
  const [state, setState] = useState({ loading: true, error: null as string | null,
    version: META.dataVersion as string, champMap: bundledChampions as ChampionMap });
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const cached = readCache();
      if (cached) setState({ loading: false, error: null, version: cached.version, champMap: cached.champMap });
      try {
        const version = await fetchLatestDdragonVersion();
        const fresh = cached && cached.version === version && Date.now() - cached.savedAt < 24 * 60 * 60 * 1000;
        const champMap = fresh ? cached.champMap : await fetchChampionMap(version);
        if (cancelled) return;
        setState({ loading: false, error: null, version, champMap });
        // Storage availability must never determine whether fetched data can be used.
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ version, champMap, savedAt: Date.now() })); } catch { /* Private mode or quota */ }
      } catch {
        if (!cancelled) setState(prev => ({ ...prev, loading: false,
          error: `Live refresh failed; using ${cached ? 'cached' : 'bundled'} champion data (${cached?.version ?? META.dataVersion}).` }));
      }
    }
    void run();
    return () => { cancelled = true; };
  }, []);
  const championList = useMemo(() => Object.values(state.champMap), [state.champMap]);
  return { ...state, championList };
}
