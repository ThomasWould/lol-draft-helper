import { useState } from "react";
import { validateDraftSession, type DraftSession } from "../draftSession";
import { META } from "../recommendations/meta";

export type SavedDraft = {
  id: string;
  name: string;
  patch: string;
  savedAt: string;
  draft: DraftSession;
};
const KEY = "draftroom.library.v1";
export const LIBRARY_LIMIT = 6;

function readLibrary(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw.length > 150000) return [];
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];
    const seen = new Set<string>();
    return entries
      .flatMap((value) => {
        if (!value || typeof value !== "object") return [];
        const v = value as Record<string, unknown>;
        const draft = validateDraftSession(v.draft);
        if (
          !draft ||
          typeof v.id !== "string" ||
          v.id.length > 80 ||
          seen.has(v.id) ||
          typeof v.name !== "string" ||
          !v.name.trim() ||
          v.name.length > 60 ||
          typeof v.patch !== "string" ||
          !/^\d+\.\d+$/.test(v.patch) ||
          typeof v.savedAt !== "string" ||
          !Number.isFinite(Date.parse(v.savedAt))
        )
          return [];
        seen.add(v.id);
        return [
          { id: v.id, name: v.name, patch: v.patch, savedAt: v.savedAt, draft },
        ];
      })
      .slice(0, LIBRARY_LIMIT);
  } catch {
    return [];
  }
}

export function useDraftLibrary() {
  const [entries, setEntries] = useState(readLibrary);
  const [status, setStatus] = useState("");
  function persist(next: SavedDraft[], message: string) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setEntries(next);
      setStatus(message);
      return true;
    } catch {
      setStatus(
        "Device storage is unavailable. Share this draft to keep a copy.",
      );
      return false;
    }
  }
  function save(name: string, draft: DraftSession) {
    if (entries.length >= LIBRARY_LIMIT) {
      setStatus("Your library is full. Remove a draft to make room.");
      return false;
    }
    const valid = validateDraftSession(draft);
    if (!valid || !name.trim()) return false;
    const entry = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 60),
      patch: META.patch,
      savedAt: new Date().toISOString(),
      draft: valid,
    };
    return persist([entry, ...entries], `Saved “${entry.name}”.`);
  }
  function remove(id: string) {
    return persist(
      entries.filter((entry) => entry.id !== id),
      "Saved draft removed.",
    );
  }
  return { entries, save, remove, status, setStatus };
}
