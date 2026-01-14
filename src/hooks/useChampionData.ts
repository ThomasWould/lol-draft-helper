// src/hooks/useChampionData.ts
import { useEffect, useMemo, useState } from "react";
import {
  ChampionMap,
  fetchChampionMap,
  fetchLatestDdragonVersion,
} from "../api/ddragon";

type State = {
  loading: boolean;
  error: string | null;
  version: string | null;
  champMap: ChampionMap | null;
};

const CACHE_KEY = "ddragon_champs_v1";

type CachePayload = {
  version: string;
  champMap: ChampionMap;
  savedAt: number;
};

export function useChampionData() {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    version: null,
    champMap: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Try cache first
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as CachePayload;
          if (!cancelled) {
            setState({
              loading: false,
              error: null,
              version: cached.version,
              champMap: cached.champMap,
            });
          }
          return;
        }

        const version = await fetchLatestDdragonVersion();
        const champMap = await fetchChampionMap(version);

        if (!cancelled) {
          setState({ loading: false, error: null, version, champMap });
        }

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ version, champMap, savedAt: Date.now() } satisfies CachePayload)
        );
      } catch (e) {
        if (!cancelled) {
          setState({
            loading: false,
            error: e instanceof Error ? e.message : "Unknown error",
            version: null,
            champMap: null,
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Precompute a list for searching
  const championList = useMemo(() => {
    if (!state.champMap) return [];
    return Object.values(state.champMap);
  }, [state.champMap]);

  return { ...state, championList };
}
