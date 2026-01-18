import { useMemo, useState } from "react";
import "./App.css";
import { useChampionData } from "./hooks/useChampionData";
import { ChampionTextarea } from "./components/ChampionTextarea";
import type { DDragonChampion } from "./api/ddragon";

// recommendations + tags
import { getDraftTagsFromTraits, tagsToPills } from "./recommendations/tags";
import { getMasterYiRec, type ChampRec } from "./recommendations/masterYi";
import { getVolibearRec } from "./recommendations/volibear";

// ✅ NEW: add these imports
import { getBelvethRec } from "./recommendations/belveth";
import { getHeimerdingerRec } from "./recommendations/heimerdinger";

import { EnemyScout } from "./components/EnemyScout";
import { CoachChat } from "./components/CoachChat";
import type { CoachContext } from "./coach/types";

// ✅ NEW: expand ChampionKey
type ChampionKey = "masteryi" | "belveth" | "volibear" | "heimerdinger";

// ✅ NEW: add champs to CHAMPIONS
const CHAMPIONS: { key: ChampionKey; label: string; role: string }[] = [
  { key: "masteryi", label: "Master Yi", role: "Jungle" },
  { key: "belveth", label: "Bel'Veth", role: "Jungle" },
  { key: "volibear", label: "Volibear", role: "Top" },
  { key: "heimerdinger", label: "Heimerdinger", role: "Top" },
];

const CHAMP_META = {
  masteryi: { label: "Master Yi", role: "Jungle" },
  belveth: { label: "Bel'Veth", role: "Jungle" },
  volibear: { label: "Volibear", role: "Top" },
  heimerdinger: { label: "Heimerdinger", role: "Top" },
} as const;

// ✅ NEW helper: top picks = Voli + Heimer
function isTopPick(k: ChampionKey) {
  return k === "volibear" || k === "heimerdinger";
}

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
  const [enemyTopRaw, setEnemyTopRaw] = useState(""); // optional for TOP champs

  function clearAllEnemyInputs() {
    setEnemyRaw("");
    setEnemyTopRaw("");
  }

  const { loading, error, version, championList } = useChampionData();

  const tokens = useMemo(() => splitTokens(enemyRaw), [enemyRaw]);
  const { matched, unmatched } = useMemo(
    () => resolveChampions(tokens, championList),
    [tokens, championList]
  );

  // resolve enemy top textbox into a champion (for Top picks)
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

  // ✅ NEW: show recs if team exists OR top input exists for top picks
  const shouldShowRecs = hasEnemyTeam || (isTopPick(selected) && hasEnemyTop);

  // ✅ NEW: Scout targets = enemy team + (if TOP pick) enemy top champ even if no team entered
  const scoutChamps = useMemo(() => {
    const base = [...matched];

    if (isTopPick(selected) && topMatched.length > 0) {
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

  // ✅ NEW: unified recommendations (4 champs)
  const rec: ChampRec = useMemo(() => {
    if (selected === "masteryi") return getMasterYiRec(tags, enemyNamesNormalized);
    if (selected === "belveth") return getBelvethRec(tags, enemyNamesNormalized);
    if (selected === "volibear")
      return getVolibearRec(tags, enemyNamesNormalized, enemyTopNormalized || undefined);
    return getHeimerdingerRec(tags, enemyNamesNormalized, enemyTopNormalized || undefined);
  }, [selected, tags, enemyNamesNormalized, enemyTopNormalized]);

  const coachContext: CoachContext = useMemo(() => {
    // ✅ NEW: champMeta for 4 champs
    const champMeta = CHAMP_META[selected];

    return {
      championKey: selected,
      championLabel: champMeta.label,
      role: champMeta.role,

      enemyTeam: matched.map((c) => c.name),

      // keep top optional; for junglers it can still show (harmless)
      enemyTop: enemyTopRaw.trim() || undefined,

      detected: {
        tanks: tags.counts.tanks ?? 0,
        ccBurst: tags.counts.ccBurst ?? 0,
        ap: tags.counts.ap ?? 0,
        ad: tags.counts.ad ?? 0,
        flex: tags.counts.flex ?? 0,
        healing: tags.counts.healing ?? 0,
        pills: tagPills,
      },

      recommendations: {
        headlineLines: rec.headlineLines ?? [],
        itemsOrdered: rec.itemsOrdered ?? [],
        fightRule: rec.fightRule,
      },
    };
  }, [selected, matched, enemyTopRaw, tags, tagPills, rec]);

  return (
    <div className="page">
      <header className="header">
        <div className="headerLeft">
          <div className="headerTextBlock">
            <h1>LoL Draft Helper</h1>

            <p className="sub">
              Fast draft notes for <b>Master Yi / Bel'Veth (Jungle)</b> and{" "}
              <b>Volibear / Heimerdinger (Top)</b>.
            </p>

            <p className="muted small headerTip">
              Tip: bookmark this page so you can open it during champ select.
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
        </div>
      </header>


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

          <div className="labelRow">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <label className="label" style={{ marginBottom: 0 }}>
                Enemy team (comma or newline separated)
              </label>

              <button
                type="button"
                className="clearBtn"
                onClick={clearAllEnemyInputs}
                disabled={!enemyRaw.trim() && !enemyTopRaw.trim()}
                title="Clear enemy team + top matchup"
              >
                Clear all
              </button>
            </div>


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

            {matched.length > 0 && (
              <div className="hint" style={{ marginTop: 10 }}>
                <b>Detected:</b>{" "}
                <span className="detRow">
                  {tags.counts.tanks ? (
                    <span className="detTag detTank">
                      {tags.counts.tanks} tank{tags.counts.tanks === 1 ? "" : "s"}
                    </span>
                  ) : null}

                  {tags.counts.ccBurst ? (
                    <span className="detTag detCC">{tags.counts.ccBurst} burst/CC</span>
                  ) : null}

                  {tags.counts.ap ? (
                    <span className="detTag detAP">{tags.counts.ap} AP</span>
                  ) : null}

                  {tags.counts.ad ? (
                    <span className="detTag detAD">{tags.counts.ad} AD</span>
                  ) : null}

                  {tags.counts.flex ? (
                    <span className="detTag detFlex">{tags.counts.flex} flex (AD/AP)</span>
                  ) : null}

                  {tags.counts.healing ? (
                    <span className="detTag detHeal">{tags.counts.healing} healing</span>
                  ) : null}

                  {tags.rangedTop ? (
                    <span className="detTag detRanged">ranged top</span>
                  ) : null}
                </span>
              </div>
            )}


            {/* ✅ NEW: Jungle champs show scout here */}
            {!isTopPick(selected) && scoutChamps.length > 0 && (
              <EnemyScout selected={selected} enemies={scoutChamps} />
            )}

            {/* ✅ NEW: Optional enemy top (for TOP champs: Voli + Heimer) */}
            {isTopPick(selected) && (
              <div style={{ marginTop: 14 }}>
                <label className="label">Enemy top (optional — improves top-lane advice)</label>
                <ChampionTextarea
                  value={enemyTopRaw}
                  onChange={setEnemyTopRaw}
                  championList={championList}
                  disabled={loading || !!error}
                />
                <div className="hint">
                  Tip: put the likely enemy top laner here (e.g., Teemo, Quinn, Gnar). Helps matchup branching.
                </div>
              </div>
            )}

            {/* ✅ NEW: Top champs show scout AFTER top input */}
            {isTopPick(selected) && scoutChamps.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <EnemyScout selected={selected} enemies={scoutChamps} />
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Recommendations */}
        <div className="card cardSticky cardGlow">
          <h2>Recommendations</h2>

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
                {isTopPick(selected)
                  ? "Start typing enemy champions (or just enemy top)"
                  : "Start typing enemy champions"}
              </div>
              <div className="emptySub">
                Add 1–5 champs on the left. We’ll auto-detect tanks, CC, AP/AD, healing, and update items/runes instantly.
              </div>
            </div>
          ) : (
            <>
              {tagPills.length > 0 && (
                <div className="pillRow" style={{ marginTop: 10 }}>
                  {tagPills
                    .filter((p) => p !== "ranged top")
                    .map((p) => (
                      <div key={p} className="pill">
                        {p}
                      </div>
                    ))}
                </div>
              )}

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
                
                {isTopPick(selected) && rec.waveTips && (
                  <div className="waveBox">
                    <div className="waveHeader">
                      <div className="waveKey">WAVE</div>
                      <div className="waveTitle">{rec.waveTips.title}</div>
                    </div>
                    <ul className="waveList">
                      {rec.waveTips.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="divider" />

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

        {/* RIGHT: Coach (docked) */}
        <div className="card cardSticky coachCard">
          <CoachChat context={coachContext} mode="dock" />
        </div>
      </div>
    </div>
  );
}