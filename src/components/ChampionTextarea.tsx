// src/components/ChampionTextarea.tsx
import { useMemo, useRef, useState } from "react";
import type { DDragonChampion } from "../api/ddragon";

type Props = {
  value: string;
  onChange: (next: string) => void;
  championList: DDragonChampion[];
  disabled?: boolean;
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

export function ChampionTextarea({ value, onChange, championList, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const { token, startIndex } = useMemo(() => getActiveToken(value), [value]);
  const q = normalize(token);

  const suggestions = useMemo(() => {
    if (!q) return [];
    const matches = championList
      .filter((c) => normalize(c.name).includes(q) || normalize(c.id).includes(q))
      .slice(0, 8);
    return matches;
  }, [q, championList]);

  function applyChampion(champ: DDragonChampion) {
    // Replace current token with champ.name
    const before = value.slice(0, startIndex);
    // Keep a single space after comma/newline if user had one
    const sep = before.endsWith(",") || before.endsWith("\n") ? " " : "";
    const next = `${before}${sep}${champ.name}`;
    onChange(next);
    setOpen(false);

    // Put cursor at end
    requestAnimationFrame(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = next.length;
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={taRef}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // slight delay so clicking suggestion works
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" || e.key === "Tab") {
            // only autocomplete if user is actively typing a token
            if (q) {
              e.preventDefault();
              applyChampion(suggestions[highlight]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Example: Diana, Zyra, Caitlyn, Darius, Thresh"
        rows={4}
        style={{ width: "100%" }}
      />

      {open && suggestions.length > 0 && q && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(20,20,20,0.98)",
            overflow: "hidden",
          }}
        >
          {suggestions.map((c, idx) => (
            <div
              key={c.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyChampion(c)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                background: idx === highlight ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
