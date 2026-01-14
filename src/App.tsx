import { useMemo, useState } from "react";
import "./App.css";
import { useChampionData } from "./hooks/useChampionData";
import { ChampionTextarea } from "./components/ChampionTextarea";
import type { DDragonChampion } from "./api/ddragon";

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
  // Data Dragon: /cdn/<version>/img/champion/<image.full>
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`;
}

/** ---- Recommendation Logic (MVP, easy to expand) ---- */

function getYiRecommendations(enemyNames: string[]) {
  // Basic heuristics; we’ll refine with real archetypes later.
  const tanky = new Set([
    "drmundo",
    "mundo",
    "ornn",
    "sion",
    "zac",
    "sejuani",
    "rammus",
    "malphite",
    "chogath",
    "tahmkench",
  ]);

  const heavyCcBurst = new Set([
    "lissandra",
    "leona",
    "nautilus",
    "rengar",
    "khazix",
    "vi",
    "syndra",
    "zed",
    "fizz",
    "diana",
    "annie",
  ]);

  const tanks = enemyNames.filter((n) => tanky.has(n)).length;
  const burstCc = enemyNames.filter((n) => heavyCcBurst.has(n)).length;

  const rune = tanks >= 2 ? "Cut Down" : "Coup de Grace";
  const wNote =
    burstCc >= 2
      ? "Lots of burst/CC — consider 1–2 early points in W (Meditate) to survive spikes."
      : "Standard skill path is fine; early W points are situational.";

  // Itemization: keep it simple + broadly correct.
  const core = [
    "Kraken Slayer (or your preferred DPS first item)",
    "Guinsoo’s Rageblade (if on-hit)",
    "Wit’s End (vs AP / mixed)",
  ];

  const situational = [
    "Blade of the Ruined King (vs high-HP/tanks)",
    "Death’s Dance (vs heavy AD burst)",
    "Guardian Angel (vs shutdown / late fights)",
    "Mercury Treads (vs lots of CC) / Steelcaps (vs heavy AD)",
  ];

  const skill = "Typical: Max Q → E → W (adjust W early if needed).";

  return { rune, wNote, skill, core, situational };
}

function getVoliRecommendations(enemyNames: string[]) {
  const rangedTop = new Set(["teemo", "vayne", "quinn", "kennen", "jayce"]);
  const hasRanged = enemyNames.some((n) => rangedTop.has(n));

  const lanePlan = hasRanged
    ? "Likely ranged/poke lane — consider Doran’s Shield + Second Wind style setup; play for all-in windows post-6."
    : "Standard bruiser lane — look for short trades into all-in windows; manage waves for dive threat with R.";

  const runes = hasRanged
    ? "Runes idea: Grasp (safer) or PTA (kill pressure) + Second Wind."
    : "Runes idea: PTA (kill pressure) or Grasp (matchup dependent).";

  const core = [
    "Plated Steelcaps / Merc Treads (matchup)",
    "Sundered Sky / Iceborn-style tanky item (matchup dependent)",
    "Spirit Visage (synergy with healing) or Frozen Heart (vs AS/AD)",
  ];

  const situational = [
    "Thornmail / Bramble (vs healing)",
    "Force of Nature (vs heavy AP)",
    "Randuin’s (vs crit)",
    "Hullbreaker (if split is the wincon)",
  ];

  const skill = "Typical: Max W → Q → E (E for setup/shield; W for sustain/trades).";

  return { lanePlan, runes, skill, core, situational };
}

export default function App() {
  const [selected, setSelected] = useState<ChampionKey>("masteryi");
  const [enemyRaw, setEnemyRaw] = useState("");

  const { loading, error, version, championList } = useChampionData();

  const tokens = useMemo(() => splitTokens(enemyRaw), [enemyRaw]);
  const { matched, unmatched } = useMemo(
    () => resolveChampions(tokens, championList),
    [tokens, championList]
  );

  const enemyNamesNormalized = useMemo(
    () => matched.map((c) => normalizeLoose(c.name)),
    [matched]
  );

  const yi = useMemo(() => getYiRecommendations(enemyNamesNormalized), [enemyNamesNormalized]);
  const voli = useMemo(() => getVoliRecommendations(enemyNamesNormalized), [enemyNamesNormalized]);

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

      <div className="card">
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
            Parsed:{" "}
            {tokens.length ? tokens.join(", ") : <span className="muted">none</span>}
          </div>

          {/* Icon chips */}
          {version && matched.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              {matched.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                  title={c.name}
                >
                  <img
                    src={championIconUrl(version, c)}
                    alt={c.name}
                    width={22}
                    height={22}
                    style={{ borderRadius: 6 }}
                  />
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                </div>
              ))}
            </div>
          )}

          {unmatched.length > 0 && (
            <div className="muted small" style={{ marginTop: 8 }}>
              Not recognized: {unmatched.join(", ")}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Recommendations</h2>

        {selected === "masteryi" && (
          <>
            <div className="pillRow">
              <div className="pill">
                Rune choice: <b>{yi.rune}</b>
              </div>
              <div className="pill">
                Skill: <b>{yi.skill}</b>
              </div>
            </div>

            <p className="note">{yi.wNote}</p>

            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Core items (MVP)
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                {yi.core.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Situational
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                {yi.situational.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <p className="muted small" style={{ marginTop: 10 }}>
              (Next: smarter archetype detection + item/rune branching by comp.)
            </p>
          </>
        )}

        {selected === "volibear" && (
          <>
            <div className="pillRow">
              <div className="pill">
                Runes idea: <b>{voli.runes}</b>
              </div>
              <div className="pill">
                Skill: <b>{voli.skill}</b>
              </div>
            </div>

            <p className="note">{voli.lanePlan}</p>

            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Core items (MVP)
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                {voli.core.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Situational
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                {voli.situational.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <p className="muted small" style={{ marginTop: 10 }}>
              (Next: lane matchups by enemy top selection + summoner spell tips.)
            </p>
          </>
        )}
      </div>

      <footer className="footer">
        <span className="muted small">Tip: bookmark this page so you can open it during champ select.</span>
      </footer>
    </div>
  );
}
