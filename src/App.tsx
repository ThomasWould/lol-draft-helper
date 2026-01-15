import { useMemo, useState } from "react";
import "./App.css";
import { useChampionData } from "./hooks/useChampionData";
import { ChampionTextarea } from "./components/ChampionTextarea";
import type { DDragonChampion } from "./api/ddragon";

// recommendations + tags
import { getDraftTagsFromTraits, tagsToPills } from "./recommendations/tags";
import { getMasterYiRec, type ChampRec } from "./recommendations/masterYi";
import { getVolibearRec } from "./recommendations/volibear";
import { EnemyScout } from "./components/EnemyScout";
import { CoachChat } from "./components/CoachChat";

type ChampionKey = "masteryi" | "volibear";

const CHAMPIONS: { key: ChampionKey; label: string; role: string }[] = [
  { key: "masteryi", label: "Master Yi", role: "Jungle" },
  { key: "volibear", label: "Volibear", role: "Top" },
];

function normalizeLoose(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitTokens(raw: string): string[] {
  return raw
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveChampions(tokens: string[], championList: DDragonChampion[]) {
  const byNormName = new Map<string, DDragonChampion>();
  const byNormId = new Map<string, DDragonChampion>();

  for (const c of championList) {
    byNormName.set(normalizeLoose(c.name), c);
    byNormId.set(normalizeLoose(c.id), c);
  }

  const matched: DDragonChampion[] = [];
  const unmatched: string[] = [];

  for (const t of tokens) {
    const key = normalizeLoose(t);
    const found = byNormName.get(key) || byNormId.get(key);
    if (found) matched.push(found);
    else unmatched.push(t);
  }

  // de-dupe while preserving order
  const seen = new Set<string>();
  const deduped = matched.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  return { matched: deduped, unmatched };
}

function championIconUrl(version: string, champ: DDragonChampion) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`;
}

// Remove one champ occurrence from the raw input
function removeEnemy(champName: string, raw: string) {
  const toks = splitTokens(raw);
  const target = normalizeLoose(champName);
  const idx = toks.findIndex((t) => normalizeLoose(t) === target);
  if (idx === -1) return raw;
  toks.splice(idx, 1);
  return toks.join(", ");
}

export default function App() {
  const [selected, setSelected] = useState<ChampionKey>("masteryi");
  const [enemyRaw, setEnemyRaw] = useState("");
  const [enemyTopRaw, setEnemyTopRaw] = useState(""); // optional for Voli

  const { loading, error, version, championList } = useChampionData();

  const tokens = useMemo(() => splitTokens(enemyRaw), [enemyRaw]);
  const { matched, unmatched } = useMemo(
    () => resolveChampions(tokens, championList),
    [tokens, championList]
  );

  // NEW: resolve enemy top textbox into a champion (for Voli-only input)
  const topTokens = useMemo(() => splitTokens(enemyTopRaw), [enemyTopRaw]);
  const { matched: topMatched } = useMemo(
    () => resolveChampions(topTokens, championList),
    [topTokens, championList]
  );

  const enemyNamesNormalized = useMemo(
    () => matched.map((c) => normalizeLoose(c.name)),
    [matched]
  );

  const enemyTopNormalized = useMemo(() => normalizeLoose(enemyTopRaw), [enemyTopRaw]);
  const hasEnemyTeam = matched.length > 0;
  const hasEnemyTop = enemyTopNormalized.length > 0;
  const shouldShowRecs = hasEnemyTeam || (selected === "volibear" && hasEnemyTop);

  // NEW: Scout targets = enemy team + (if Voli) enemy top champ even if no team entered
  const scoutChamps = useMemo(() => {
    const base = [...matched];

    if (selected === "volibear" && topMatched.length > 0) {
      const top = topMatched[0];
      if (!base.some((c) => c.id === top.id)) base.unshift(top);
    }

  return base;
}, [matched, selected, topMatched]);

  // tags + pills from your tag engine
  const tags = useMemo(() => {
    return getDraftTagsFromTraits(
      enemyNamesNormalized,
      championList,
      enemyTopNormalized || undefined
    );
  }, [enemyNamesNormalized, enemyTopNormalized, championList]);

  const tagPills = useMemo(() => tagsToPills(tags), [tags]);

  // unified recommendations
  const rec: ChampRec = useMemo(() => {
  return selected === "masteryi"
    ? getMasterYiRec(tags, enemyNamesNormalized)
    : getVolibearRec(tags, enemyNamesNormalized, enemyTopNormalized || undefined);
}, [selected, tags, enemyNamesNormalized, enemyTopNormalized]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>LoL Draft Helper</h1>
          <p className="sub">
            Fast draft notes for <b>Master Yi (Jungle)</b> and <b>Volibear (Top)</b>.
          </p>
        </div>
        <a
          className="link"
          href="https://github.com/ThomasWould/lol-draft-helper"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

      {/* ✅ 2-column grid on desktop, stacked on mobile */}
      <div className="grid">
        {/* LEFT: Inputs */}
        <div className="card inputsCard">
          <div className="row">
            <label className="label">Pick your champion</label>
            <div className="segmented">
              {CHAMPIONS.map((c) => (
                <button
                  key={c.key}
                  className={`segBtn ${selected === c.key ? "active" : ""}`}
                  onClick={() => setSelected(c.key)}
                  type="button"
                >
                  {c.label} <span className="muted">({c.role})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="row">
            <label className="label">Enemy team (comma or newline separated)</label>

            {loading && <div className="muted small">Loading champion data…</div>}
            {error && <div className="muted small">Couldn’t load Data Dragon: {error}</div>}

            <ChampionTextarea
              value={enemyRaw}
              onChange={setEnemyRaw}
              championList={championList}
              disabled={loading || !!error}
            />

            <div className="hint">
              Parsed: {tokens.length ? tokens.join(", ") : <span className="muted">none</span>}
            </div>

            {/* Icon chips (click to remove) */}
            {version && matched.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                {matched.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chip"
                    title="Click to remove"
                    onClick={() => setEnemyRaw((prev) => removeEnemy(c.name, prev))}
                  >
                    <img
                      src={championIconUrl(version, c)}
                      alt={c.name}
                      width={22}
                      height={22}
                      style={{ borderRadius: 6 }}
                    />
                    <span style={{ fontSize: 13 }}>{c.name}</span>
                    <span className="chipX">×</span>
                  </button>
                ))}
              </div>
            )}

            {unmatched.length > 0 && (
              <div className="muted small" style={{ marginTop: 8 }}>
                Not recognized: {unmatched.join(", ")}
              </div>
            )}

            {/* Detected summary (from tags.counts) */}
            {matched.length > 0 && (
              <div className="hint" style={{ marginTop: 10 }}>
                <b>Detected:</b>{" "}
                {[
                  tags.counts.tanks ? `${tags.counts.tanks} tank${tags.counts.tanks === 1 ? "" : "s"}` : null,
                  tags.counts.ccBurst ? `${tags.counts.ccBurst} burst/CC` : null,
                  tags.counts.ap ? `${tags.counts.ap} AP` : null,
                  tags.counts.ad ? `${tags.counts.ad} AD` : null,
                  tags.counts.flex ? `${tags.counts.flex} flex (AD/AP)` : null,
                  tags.counts.healing ? `${tags.counts.healing} healing` : null,
                  tags.rangedTop ? "ranged top (from top pick)" : null,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            )}

            {/* Enemy notes: for Yi show here (under detected) */}
            {selected !== "volibear" && scoutChamps.length > 0 && (
              <EnemyScout selected={selected} enemies={scoutChamps} />
            )}

            {/* Optional enemy top (only for Volibear) */}
            {selected === "volibear" && (
              <div style={{ marginTop: 14 }}>
                <label className="label">Enemy top (optional — improves Volibear advice)</label>
                <ChampionTextarea
                  value={enemyTopRaw}
                  onChange={setEnemyTopRaw}
                  championList={championList}
                  disabled={loading || !!error}
                />
                <div className="hint">
                  Tip: put the likely enemy top laner here (e.g., Teemo, Quinn, Gnar). This helps detect ranged/poke lanes.
                </div>
              </div>
            )}
            {/* Enemy notes: for Voli show AFTER the enemy top input */}
            {selected === "volibear" && scoutChamps.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <EnemyScout selected={selected} enemies={scoutChamps} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Recommendations */}
        <div className="card cardSticky cardGlow">
          <h2>Recommendations</h2>
          
          {/* Recommended bans */}
          {rec.bans && rec.bans.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                RECOMMENDED BANS:
              </div>
              <div className="pillRow" style={{ marginTop: 8 }}>
                {rec.bans.map((b) => (
                  <div key={b} className="pill">
                    {b}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!shouldShowRecs ? (
          <div className="emptyState">
            <div className="emptyTitle">
            {selected === "volibear" ? "Start typing enemy champions (or just enemy top)" : "Start typing enemy champions"}
            </div>
            <div className="emptySub">
              Add 1–5 champs on the left. We’ll auto-detect tanks, CC, AP/AD, healing, and update items/runes instantly.
            </div>
          </div>
        ) : (
          <>
            {/* Tag pills */}
            {tagPills.length > 0 && (
              <div className="pillRow" style={{ marginTop: 10 }}>
                {tagPills
                  .filter((p) => p !== "ranged top") // hide this pill
                  .map((p) => (
                    <div key={p} className="pill">
                      {p}
                    </div>
                  ))}
              </div>
            )}

            {/* Coach-note style headline lines */}
            <div className="recLines">
              {rec.headlineLines.map((line) => {
                const idx = line.indexOf(":");
                const key = idx !== -1 ? line.slice(0, idx) : "NOTE";
                const val = idx !== -1 ? line.slice(idx + 1).trim() : line;
                return (
                  <div key={line} className="recLine">
                    <div className="recKey">{key}</div>
                    <div className="recVal">{val}</div>
                  </div>
                );
              })}
            </div>

            <div className="divider" />

            {/* Items in order */}
            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                ITEMS (IN ORDER):
              </div>

              <ul className="itemList">
                {rec.itemsOrdered.map((it, idx) => (
                  <li key={`${it.name}-${idx}`} className="itemRow">
                    <span className="itemNum">{idx + 1}</span>
                    <span className="itemName">{it.name}</span>
                    {it.note &&
                      (it.note.includes("BUY HERE") ? (
                        <span className="buyHere">{it.note}</span>
                      ) : (
                        <span className="itemNote">{it.note}</span>
                      ))}
                  </li>
                ))}
              </ul>
            </div>

            <div className="divider" />

            {/* Fight rule */}
            {rec.fightRule && (
              <div style={{ marginTop: 14 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  FIGHT RULE:
                </div>

                <div className="fightRuleBox">
                  <p className="fightRuleText">{rec.fightRule}</p>
                </div>
              </div>
            )}

            <p className="muted small" style={{ marginTop: 10 }}>
              (Next: add “key threats” callout + better matchup branching.)
            </p>
          </>
        )}
        </div>
      </div>
      <footer className="footer">
        <span className="muted small">Tip: bookmark this page so you can open it during champ select.</span>
      </footer>
      <CoachChat
        selected={selected}
        enemyNames={enemyNamesNormalized}
        enemyTop={selected === "volibear" ? enemyTopNormalized : undefined}
        tags={tags}
      />
    </div>
  );
}
