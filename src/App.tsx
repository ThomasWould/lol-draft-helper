import { useMemo, useState } from "react";
import "./App.css";
import { useChampionData } from "./hooks/useChampionData";
import { ChampionTextarea } from "./components/ChampionTextarea";
import { championIconUrl } from "./api/ddragon";

type ChampionKey = "masteryi" | "volibear";

const CHAMPIONS: { key: ChampionKey; label: string; role: string }[] = [
  { key: "masteryi", label: "Master Yi", role: "Jungle" },
  { key: "volibear", label: "Volibear", role: "Top" },
];

function normalize(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’.]/g, "")
    .replace(/\s+/g, " ");
}

// a stricter normalize for matching Data Dragon names
function normalizeKey(input: string) {
  return normalize(input).replace(/[^a-z0-9 ]/g, "");
}

function splitChampions(raw: string): string[] {
  return raw
    .split(/,|\n/)
    .map((s) => normalize(s))
    .filter(Boolean);
}

function getYiRuneNote(enemies: string[]) {
  const tankyKeywords = [
    "mundo",
    "ornn",
    "sion",
    "zac",
    "sejuani",
    "rammus",
    "malphite",
    "cho gath",
    "chogath",
    "tahm",
    "tahm kench",
  ];
  const tankCount = enemies.filter((e) => tankyKeywords.some((t) => e.includes(t))).length;

  const rune = tankCount >= 2 ? "Cut Down" : "Coup de Grace";

  const burstCcKeywords = [
    "annie",
    "lissandra",
    "leona",
    "nautilus",
    "rengar",
    "kha",
    "khazix",
    "vi",
    "syndra",
    "zed",
    "fizz",
    "diana",
  ];
  const burstCount = enemies.filter((e) => burstCcKeywords.some((b) => e.includes(b))).length;
  const wNote =
    burstCount >= 2
      ? "Matchup has a lot of burst/CC — consider 1–2 early points in W (Meditate) to survive spikes."
      : "Probably fine to max Q/E as usual; W points are situational.";

  return { rune, wNote };
}

function getVoliNotes(enemies: string[]) {
  const rangedTopKeywords = ["teemo", "vayne", "quinn", "kennen", "jayce"];
  const rangedTop = enemies.some((e) => rangedTopKeywords.some((r) => e.includes(r)));
  return rangedTop
    ? "Likely ranged/poke lane — consider Doran’s Shield + Second Wind style setup."
    : "Standard bruiser lane — play for short trades and all-in windows.";
}

export default function App() {
  const [selected, setSelected] = useState<ChampionKey>("masteryi");
  const [enemyRaw, setEnemyRaw] = useState("");

  // Data Dragon load
  const { loading, error, version, champMap, championList } = useChampionData();

  const enemies = useMemo(() => splitChampions(enemyRaw), [enemyRaw]);

  const yi = useMemo(() => getYiRuneNote(enemies), [enemies]);
  const voli = useMemo(() => getVoliNotes(enemies), [enemies]);

  // Build quick lookup: normalized champ name -> champ
  const champByName = useMemo(() => {
    if (!champMap) return null;
    const map = new Map<string, { name: string; imageFull: string }>();
    Object.values(champMap).forEach((c) => {
      map.set(normalizeKey(c.name), { name: c.name, imageFull: c.image.full });
      map.set(normalizeKey(c.id), { name: c.name, imageFull: c.image.full });
    });
    return map;
  }, [champMap]);

  const matchedEnemyIcons = useMemo(() => {
    if (!version || !champByName) return [];
    return enemies
      .map((e) => champByName.get(normalizeKey(e)) || null)
      .filter(Boolean)
      .map((c) => ({
        name: c!.name,
        url: championIconUrl(version, c!.imageFull),
      }));
  }, [enemies, champByName, version]);

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
          <label className="label" htmlFor="enemies">
            Enemy team (comma or newline separated)
          </label>

          {/* Autocomplete textarea */}
          <div className="textarea">
            <ChampionTextarea
              value={enemyRaw}
              onChange={setEnemyRaw}
              championList={championList}
              disabled={loading}
            />
          </div>

          {/* Small status */}
          {loading && (
            <div className="hint">
              <span className="muted">Loading champion list…</span>
            </div>
          )}
          {error && (
            <div className="hint">
              <span className="muted">Couldn’t load champion list: {error}</span>
            </div>
          )}

          <div className="hint">
            Parsed: {enemies.length ? enemies.join(", ") : <span className="muted">none</span>}
          </div>

          {/* Icons preview */}
          {matchedEnemyIcons.length > 0 && (
            <div className="hint" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {matchedEnemyIcons.map((c) => (
                <div
                  key={c.name}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                  title={c.name}
                >
                  <img
                    src={c.url}
                    alt={c.name}
                    width={22}
                    height={22}
                    style={{ borderRadius: 6 }}
                  />
                  <span className="muted">{c.name}</span>
                </div>
              ))}
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
            </div>
            <p className="note">{yi.wNote}</p>
            <p className="muted small">(MVP logic for now — we’ll refine matchups and add itemization next.)</p>
          </>
        )}

        {selected === "volibear" && (
          <>
            <p className="note">{voli}</p>
            <p className="muted small">(MVP logic for now — we’ll add rune/build branches for common matchups.)</p>
          </>
        )}
      </div>

      <footer className="footer">
        <span className="muted small">Tip: bookmark this page so you can open it during champ select.</span>
      </footer>
    </div>
  );
}
