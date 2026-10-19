// src/components/ChampionTextarea.tsx
import { useId, useMemo, useRef, useState } from "react";
import type { DDragonChampion } from "../api/ddragon";
import { GameIcon } from "./GameIcon";
import { META } from "../recommendations/meta";

type Props = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  championList: DDragonChampion[];
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Finds the current token being typed (after last comma/newline)
function getActiveToken(text: string) {
  const lastBreak = Math.max(text.lastIndexOf(","), text.lastIndexOf("\n"));
  const start = lastBreak === -1 ? 0 : lastBreak + 1;
  const token = text.slice(start).trimStart(); // keep if user typed space
  return { startIndex: start, token };
}

export function ChampionTextarea({
  id,
  value,
  onChange,
  championList,
  disabled,
  placeholder = "Example: Diana, Zyra, Caitlyn, Darius, Thresh",
  rows = 4,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const suggestionId = useId();

  const { token, startIndex } = useMemo(() => getActiveToken(value), [value]);
  const q = normalize(token);

  const suggestions = useMemo(() => {
    if (!q) return [];
    const matches = championList
      .filter(
        (c) => normalize(c.name).includes(q) || normalize(c.id).includes(q),
      )
      .slice(0, 8);
    return matches;
  }, [q, championList]);

  function applyChampion(champ: DDragonChampion) {
    // Replace current token with champ.name (+ comma+space so user can keep typing)
    const before = value.slice(0, startIndex);
    const beforeTrimmedRight = before.replace(/[ \t]+$/g, ""); // avoid double spaces

    const needsSpaceAfterSeparator =
      beforeTrimmedRight.endsWith(",") || beforeTrimmedRight.endsWith("\n");
    const sepSpace = needsSpaceAfterSeparator ? " " : "";

    // If user is mid-token, replace it; if token empty, just append
    const nextBase = `${beforeTrimmedRight}${sepSpace}${champ.name}`;

    // Add comma+space to continue drafting unless user is using newline style
    const addComma =
      // if they’re already using newlines as separators at least once, keep newline style
      value.includes("\n") && !value.includes(",") ? "\n" : ", ";

    const next = `${nextBase}${addComma}`;

    onChange(next);
    setOpen(false);
    setHighlight(0);

    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = next.length;
    });
  }

  return (
    <div className="championInput">
      <textarea
        id={id}
        className="textarea"
        ref={taRef}
        disabled={disabled}
        value={value}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={
          open && suggestions.length > 0 ? suggestionId : undefined
        }
        aria-activedescendant={
          open && suggestions.length > 0
            ? `${suggestionId}-${Math.min(highlight, suggestions.length - 1)}`
            : undefined
        }
        onChange={(e) => {
          onChange(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => {
          if (q) setOpen(true);
        }}
        onBlur={() => {
          // slight delay so clicking suggestion works
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          // Only handle keys when dropdown is open and we have suggestions
          if (!open || suggestions.length === 0) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" || e.key === "Tab") {
            if (q) {
              e.preventDefault();
              applyChampion(
                suggestions[Math.min(highlight, suggestions.length - 1)],
              );
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        rows={rows}
      />

      {open && q && suggestions.length > 0 && (
        <div className="suggestionPanel">
          <div
            className="suggestions"
            id={suggestionId}
            role="listbox"
            aria-label={`${ariaLabel ?? "Champion"} suggestions`}
          >
            {suggestions.map((c, idx) => (
              <div
                key={c.id}
                id={`${suggestionId}-${idx}`}
                className={`suggestion ${idx === highlight ? "highlighted" : ""}`}
                role="option"
                aria-selected={idx === highlight}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyChampion(c)}
              >
                <GameIcon
                  label={c.name}
                  src={`https://ddragon.leagueoflegends.com/cdn/${META.dataVersion}/img/champion/${c.image.full}`}
                />
                <span>
                  {c.name}
                  <small>{c.tags.join(" · ")}</small>
                </span>
                <span className="suggestionEnter">↵</span>
              </div>
            ))}
          </div>
          <div className="suggestionHelp">
            ↑ ↓ Navigate <span>↵ Select</span>
            <span>esc Close</span>
          </div>
        </div>
      )}
    </div>
  );
}
