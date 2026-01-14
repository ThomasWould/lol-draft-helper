import { useMemo, useState } from "react";

type Analysis = {
  yiRune: "Coup de Grace" | "Cut Down";
  yiWNote: string;
  threats: string[];
  voliLaneNote: string;
  voliBuildDirection: "Bruiser" | "Tank";
};

const CHAMPS = [
  "Aatrox","Ahri","Akali","Alistar","Amumu","Annie","Ashe","Aurelion Sol",
  "Blitzcrank","Brand","Braum","Briar","Caitlyn","Camille","Cassiopeia","Cho'Gath",
  "Darius","Diana","Dr. Mundo","Ekko","Evelynn","Ezreal","Fiora","Fizz","Galio","Garen",
  "Gwen","Hecarim","Heimerdinger","Illaoi","Irelia","Jax","Jhin","Jinx","K'Sante",
  "Kai'Sa","Kalista","Karma","Karthus","Kassadin","Katarina","Kayle","Kayn","Kha'Zix",
  "Kindred","Kled","Kog'Maw","LeBlanc","Lee Sin","Leona","Lillia","Lissandra","Lucian",
  "Lulu","Lux","Malphite","Malzahar","Maokai","Master Yi","Milio","Miss Fortune",
  "Mordekaiser","Morgana","Nami","Nasus","Nautilus","Nilah","Nocturne","Nunu & Willump",
  "Olaf","Orianna","Ornn","Poppy","Pyke","Rakan","Rek'Sai","Renekton","Rengar","Riven",
  "Rumble","Ryze","Samira","Sejuani","Senna","Seraphine","Sett","Shaco","Shen","Shyvana",
  "Singed","Sion","Sivir","Skarner","Smolder","Sona","Soraka","Swain","Sylas","Syndra",
  "Tahm Kench","Taliyah","Teemo","Thresh","Tristana","Tryndamere","Twisted Fate",
  "Twitch","Udyr","Urgot","Varus","Vayne","Veigar","Vel'Koz","Vex","Vi","Viego",
  "Viktor","Vladimir","Volibear","Warwick","Wukong","Xayah","Xerath","Xin Zhao",
  "Yasuo","Yone","Yorick","Yuumi","Zac","Zed","Zeri","Ziggs","Zilean","Zoe","Zyra",
];

const TANKY = new Set([
  "Ornn","Sion","Dr. Mundo","Zac","Sejuani","Maokai","Malphite","Cho'Gath","Tahm Kench",
  "Shen","Rammus","Amumu","Nautilus","Leona","Alistar","Braum","Poppy","Skarner","Udyr",
  "Galio",
]);

const BRUISERY = new Set([
  "Darius","Sett","Garen","Illaoi","Renekton","Mordekaiser","Aatrox","Olaf","Urgot",
  "Jax","Camille","Wukong","Warwick","Kled","Riven","Fiora","Gwen","Tryndamere","Yone",
  "Yasuo","Nasus","Volibear",
]);

const HARD_CC = new Set([
  "Leona","Nautilus","Thresh","Blitzcrank","Alistar","Sejuani","Zac","Vi","Skarner",
  "Lissandra","Annie","Galio","Maokai","Malphite","Amumu","Braum","Poppy","Morgana",
]);

const BURSTY = new Set([
  "Zed","Katarina","Akali","Diana","Fizz","LeBlanc","Rengar","Kha'Zix","Evelynn",
  "Syndra","Annie","Veigar","Vex","Ahri",
]);

function normalize(name: string) {
  return name.trim();
}

function analyze(enemy: string[], enemyTop?: string): Analysis {
  const cleaned = enemy.map(normalize).filter(Boolean);

  let tanks = 0;
  let beefy = 0;
  let hardCc = 0;
  let burst = 0;

  for (const c of cleaned) {
    if (TANKY.has(c)) tanks++;
    if (TANKY.has(c) || BRUISERY.has(c)) beefy++;
    if (HARD_CC.has(c)) hardCc++;
    if (BURSTY.has(c)) burst++;
  }

  const yiRune: Analysis["yiRune"] = tanks >= 2 || beefy >= 3 ? "Cut Down" : "Coup de Grace";

  const threats: string[] = [];
  if (hardCc >= 2) threats.push("Heavy CC");
  if (burst >= 2) threats.push("High burst");
  if (tanks >= 2 || beefy >= 3) threats.push("Tanky front line");
  if (threats.length === 0) threats.push("Balanced / no extreme profile");

  const yiWNote =
    hardCc >= 2 && burst >= 1
      ? "Consider 1–2 early points in W to survive burst + lockdown windows."
      : hardCc >= 2
      ? "W points can help if you’re getting locked down; otherwise standard damage/tempo."
      : burst >= 2
      ? "If you’re getting chunked by burst, 1 extra W point can stabilize fights."
      : "Likely standard skill order; W points usually not needed early.";

  let voliLaneNote =
    "Short trades early; respect level spikes and track jungler. Commit when you have cooldown advantage.";
  if (enemyTop) {
    const t = enemyTop;
    const ranged = new Set(["Teemo","Vayne","Quinn","Kayle","Kennen","Gnar","Jayce","Akshan"]);
    if (ranged.has(t)) {
      voliLaneNote =
        "Vs ranged: use brush, play for short trades, don’t bleed HP. Look for level 3–6 all-in windows when they misstep.";
    } else if (TANKY.has(t)) {
      voliLaneNote =
        "Vs tank: push tempo with short trades and wave control. Win through pressure and objective timing, not always solo kills.";
    } else if (BRUISERY.has(t)) {
      voliLaneNote =
        "Vs bruiser: respect spikes; trade around your cooldowns. Short, disciplined trades then all-in on advantage.";
    }
  }

  const voliBuildDirection: Analysis["voliBuildDirection"] = tanks >= 2 || hardCc >= 2 ? "Tank" : "Bruiser";

  return { yiRune, yiWNote, threats, voliLaneNote, voliBuildDirection };
}

function ChampInput({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, opacity: 0.85 }}>{label}</label>
      <input
        id={id}
        list="champions"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing…"
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

export default function App() {
  const [enemy, setEnemy] = useState<string[]>(["", "", "", "", ""]);
  const [enemyTop, setEnemyTop] = useState<string>("");

  const canAnalyze = useMemo(() => enemy.some((e) => e.trim().length > 0), [enemy]);

  const result = useMemo(() => {
    if (!canAnalyze) return null;
    const cleaned = enemy.map(normalize).filter(Boolean);
    const top = enemyTop.trim() ? normalize(enemyTop) : undefined;
    return analyze(cleaned, top);
  }, [canAnalyze, enemy, enemyTop]);

  const copySummary = async () => {
    if (!result) return;
    const lines = [
      "LoL Draft Helper (Yi + Voli)",
      `Yi Rune: ${result.yiRune}`,
      `Yi W: ${result.yiWNote}`,
      `Threats: ${result.threats.join(", ")}`,
      `Voli Lane: ${result.voliLaneNote}`,
      `Voli Build: ${result.voliBuildDirection}`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    alert("Copied!");
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 18, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <h1 style={{ margin: "8px 0 4px" }}>LoL Draft Helper</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        MVP for Master Yi (jungle) + Volibear (top). Type enemy champs and get quick recommendations.
      </p>

      <datalist id="champions">
        {CHAMPS.map((c) => <option value={c} key={c} />)}
      </datalist>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Enemy Team</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {enemy.map((v, idx) => (
              <ChampInput
                key={idx}
                id={`enemy-${idx}`}
                label={`Enemy ${idx + 1}`}
                value={v}
                onChange={(nv) => setEnemy((prev) => prev.map((p, i) => (i === idx ? nv : p)))}
              />
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <ChampInput
              id="enemy-top"
              label="Which one is enemy top? (optional)"
              value={enemyTop}
              onChange={setEnemyTop}
            />
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Tip: pick from the enemy champs above for best Voli lane notes.
            </div>
          </div>
        </div>

        <div style={{ padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Recommendations</h2>

          {!result ? (
            <div style={{ opacity: 0.75 }}>
              Enter at least one enemy champion to see recommendations.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Master Yi</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Rune: {result.yiRune}</div>
                <div style={{ marginTop: 6 }}>{result.yiWNote}</div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                  Threats: {result.threats.join(" • ")}
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.12)", margin: "14px 0" }} />

              <div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Volibear (Top)</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Build: {result.voliBuildDirection}</div>
                <div style={{ marginTop: 6 }}>{result.voliLaneNote}</div>
              </div>

              <button
                onClick={copySummary}
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Copy Summary
              </button>
            </>
          )}
        </div>
      </div>

      <p style={{ marginTop: 18, fontSize: 12, opacity: 0.65 }}>
        Note: This is a rules-based MVP. Next we can add champion icons + smarter archetypes via Riot Data Dragon.
      </p>
    </div>
  );
}
