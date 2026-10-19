import { useEffect, useState } from "react";
import { CHAMPIONS, META, type ChampionKey } from "../recommendations/meta";

export type DraftSession = {
  selected: ChampionKey;
  enemyRaw: string;
  enemyTopRaw: string;
  enemyBotRaw: string;
};
const STORAGE_KEY = "draftroom.session.v1";
const EMPTY: DraftSession = {
  selected: "masteryi",
  enemyRaw: "",
  enemyTopRaw: "",
  enemyBotRaw: "",
};

function validate(value: unknown): DraftSession | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.selected !== "string" || !Object.hasOwn(CHAMPIONS, v.selected))
    return null;
  if (
    !["enemyRaw", "enemyTopRaw", "enemyBotRaw"].every(
      (k) => typeof v[k] === "string" && v[k].length <= 2000,
    )
  )
    return null;
  return {
    selected: v.selected as ChampionKey,
    enemyRaw: v.enemyRaw as string,
    enemyTopRaw: v.enemyTopRaw as string,
    enemyBotRaw: v.enemyBotRaw as string,
  };
}

function readInitial() {
  if (window.location.hash.startsWith("#draft=")) {
    try {
      const raw = window.location.hash.slice(7);
      if (raw.length > 40000) throw new Error("Oversized draft");
      const payload = JSON.parse(decodeURIComponent(raw));
      const draft = payload.v === 1 ? validate(payload.draft) : null;
      if (!draft) throw new Error("Invalid draft");
      return {
        draft,
        notice:
          payload.patch === META.patch
            ? "Shared draft loaded."
            : "Shared draft loaded. Recommendations use the currently reviewed patch.",
      };
    } catch {
      return {
        draft: EMPTY,
        notice: "This draft link could not be read. Start a new draft below.",
      };
    }
  }
  try {
    const draft = validate(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"),
    );
    if (draft) return { draft, notice: "Your last draft is ready." };
  } catch {
    /* Storage may be unavailable or contain an old value. */
  }
  return { draft: EMPTY, notice: "" };
}

export function draftLink(draft: DraftSession) {
  const url = new URL(window.location.href);
  url.hash = `draft=${encodeURIComponent(JSON.stringify({ v: 1, patch: META.patch, draft }))}`;
  return url.toString();
}

export function useDraftSession() {
  const [initial] = useState(readInitial);
  const [draft, setDraft] = useState(initial.draft);
  const [notice, setNotice] = useState(initial.notice);
  const [savedDraft, setSavedDraft] = useState<string | null>(null);
  const serialized = JSON.stringify(draft);
  useEffect(() => {
    // Consume imported links so a refresh restores subsequent edits.
    const consumeLink = () => {
      if (window.location.hash.startsWith("#draft=")) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    };
    const importLink = () => {
      if (!window.location.hash.startsWith("#draft=")) return;
      const imported = readInitial();
      setDraft(imported.draft);
      setNotice(imported.notice);
      consumeLink();
    };
    consumeLink();
    window.addEventListener("hashchange", importLink);
    return () => window.removeEventListener("hashchange", importLink);
  }, []);
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch {
        /* Best effort when leaving. */
      }
    };
    window.addEventListener("pagehide", flush);
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serialized);
        setSavedDraft(serialized);
      } catch {
        setSavedDraft(null);
      }
    }, 150);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
    };
  }, [serialized]);
  return {
    draft,
    setDraft,
    saved: savedDraft === serialized,
    notice,
  };
}
