// src/hooks/useChampionData.ts
import { useEffect, useMemo, useState } from "react";
import type { ChampionMap } from "../api/ddragon";
import { fetchChampionMap, fetchLatestDdragonVersion } from "../api/ddragon";

type State = {
  loading: boolean;
  error: string | null;
  version: string | null;
  champMap: ChampionMap | null;
};

const CACHE_KEY = "ddragon_champs_v2";

// Refresh cached champ list after N days even if version check fails or is skipped.
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

type CachePayload = {
  version: string;
  champMap: ChampionMap;
  savedAt: number;
};

function safeParseCache(raw: string | null): CachePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed?.version || !parsed?.champMap || !parsed?.savedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

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
        const cached = safeParseCache(localStorage.getItem(CACHE_KEY));
        const cacheIsFresh =
          !!cached && Date.now() - cached.savedAt < CACHE_TTL_MS;

        // 1) If we have cache, show it immediately (fast paint)
        if (cached && !cancelled) {
          setState({
            loading: false,
            error: null,
            version: cached.version,
            champMap: cached.champMap,
          });
        }

        // 2) Always check Riot's latest Data Dragon version.
        // Riot recommends using the most recent Data Dragon version. :contentReference[oaicite:1]{index=1}
        const latestVersion = await fetchLatestDdragonVersion();

        const needsRefresh =
          !cached || !cacheIsFresh || cached.version !== latestVersion;

        if (!needsRefresh) {
          // Cache is fresh and version matches.
          if (!cancelled && !cached) {
            // edge case: should not happen, but keep safe
            setState((s) => ({ ...s, loading: false }));
          }
          return;
        }

        // 3) Refetch latest champion map
        const champMap = await fetchChampionMap(latestVersion);

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            version: latestVersion,
            champMap,
          });
        }

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            version: latestVersion,
            champMap,
            savedAt: Date.now(),
          } satisfies CachePayload)
        );
      } catch (e) {
        if (!cancelled) {
          setState((prev) => ({
            // If we already had cache rendered, keep it and just surface an error silently if you want.
            // For now, we show the error but don't wipe existing data.
            ...prev,
            loading: false,
            error: e instanceof Error ? e.message : "Unknown error",
          }));
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const championList = useMemo(() => {
    if (!state.champMap) return [];
    return Object.values(state.champMap);
  }, [state.champMap]);

  return { ...state, championList };
}
