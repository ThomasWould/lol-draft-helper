// src/components/EnemyScout.tsx
import { useMemo } from "react";
import type { DDragonChampion } from "../api/ddragon";

type Selected = "masteryi" | "volibear";

type Props = {
  selected: Selected;
  enemies: DDragonChampion[]; // matched champs from DDragon
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type Scout = {
  title?: string; // short header line
  bullets: string[];
  tags?: string[]; // tiny pills
};

// --- Champion-specific notes (start small, grow over time) ---
const SCOUT_MAP: Record<
  string,
  Partial<Record<Selected | "any", Scout>>
> = {
  // Common supports / engage
  thresh: {
    any: {
      tags: ["Pick", "CC chain"],
      title: "Hook → Flay → Box can delete carries.",
      bullets: [
        "Respect fog angles; don’t walk into hook + lantern collapse.",
        "If hook misses, you have a short punish window.",
      ],
    },
    masteryi: {
      tags: ["Hold Q"],
      title: "Save Q to dodge hook/Flay when possible.",
      bullets: [
        "If you Q in early, you can get chained by Flay + Box.",
        "Front-to-back into Thresh is rough—look for flanks/angles.",
      ],
    },
  },

  leona: {
    any: {
      tags: ["Hard engage"],
      title: "If she reaches you, you’re CC’d for days.",
      bullets: [
        "Don’t stand in E range when she has ult up.",
        "After she commits, punish the backline—Leona can’t peel well.",
      ],
    },
    masteryi: {
      tags: ["Patience"],
      title: "Let Leona press buttons first, then clean up.",
      bullets: [
        "If you go first, you’ll eat stun chain.",
        "Wait for E/R to be used → then commit for resets.",
      ],
    },
  },

  // Mages / poke
  lux: {
    any: {
      tags: ["Poke", "Pick"],
      title: "Q bind is the real threat; E chip sets up R.",
      bullets: [
        "Play around her Q cooldown—miss = punish window.",
        "Don’t clump: you eat E slow + multi-man poke.",
      ],
    },
    masteryi: {
      tags: ["Q timing"],
      title: "Your Q can dodge her Q and even her R if timed well.",
      bullets: [
        "If ahead: one clean engage kills her instantly.",
        "If behind: wait for Lux Q to be used before committing.",
      ],
    },
  },

  morgana: {
    any: {
      tags: ["Bind", "Anti-engage"],
      title: "One Q can lose the fight; Black Shield blocks picks.",
      bullets: [
        "Track Black Shield target—don’t waste CC into it.",
        "Punish when Q is down; she’s vulnerable.",
      ],
    },
    masteryi: {
      tags: ["Q dodge"],
      title: "Hold Q to dodge bind; don’t get rooted before you reset.",
      bullets: [
        "If you’re rooted, you usually die—play angles.",
        "Wait for shield to be used then burst the target.",
      ],
    },
  },

  // ADC threats
  tristana: {
    any: {
      tags: ["Burst", "Peel R"],
      title: "Charge burst + R can deny your engage.",
      bullets: [
        "Track her jump—if it’s down, she’s very killable.",
        "Don’t tank fully stacked bomb for free.",
      ],
    },
    masteryi: {
      tags: ["Target"],
      title: "Great reset target if you can reach her after jump.",
      bullets: [
        "Force or wait out jump, then commit for kill/reset.",
        "Be careful: her R can knock you away mid-fight.",
      ],
    },
  },

  vayne: {
    any: {
      tags: ["Tank shred"],
      title: "True damage + tumble makes extended fights dangerous.",
      bullets: [
        "She spikes hard with items—don’t let her free-hit.",
        "Condemn can ruin engages near walls—watch positioning.",
      ],
    },
    masteryi: {
      tags: ["Priority"],
      title: "If you reach her, she dies. The fight is about access.",
      bullets: [
        "Wait for condemn / tumble usage, then go.",
        "Don’t eat peel CC before you commit.",
      ],
    },
  },

  // Top lane examples (from your screenshot pool)
  gwen: {
    any: {
      tags: ["Anti-melee"],
      title: "W denies outside damage; her R turns long fights.",
      bullets: [
        "Fight inside W or wait it out—don’t panic engage into it.",
        "Avoid long trades when she has stacked Q + R up.",
      ],
    },
    volibear: {
      tags: ["AP duel"],
      title: "Respect her all-in—choose short trades and wave control.",
      bullets: [
        "Early MR (Spectre’s/Negatron) pays off if she gets ahead.",
        "Don’t commit into W unless you can stay on her.",
      ],
    },
  },

  kayle: {
    any: {
      tags: ["Scaling"],
      title: "Weak early, monster later. Deny levels/plates.",
      bullets: [
        "Punish pre-6; after 6 respect ult turning dives.",
        "Wave control matters: freeze to starve, crash to dive.",
      ],
    },
    volibear: {
      tags: ["Dive threat"],
      title: "You can punish her early with wave + dive pressure.",
      bullets: [
        "Push/freeze to deny XP, then threaten dives with jungler.",
        "Respect ult when diving—bait it, then re-engage.",
      ],
    },
  },

  warwick: {
    any: {
      tags: ["Sustain", "All-in"],
      title: "He wins messy extended fights—don’t coinflip low HP.",
      bullets: [
        "Anti-heal helps once fights start.",
        "Respect R engage range; he can start for free.",
      ],
    },
    masteryi: {
      tags: ["Don’t duel"],
      title: "Avoid fair duels when he has ult + fear ready.",
      bullets: [
        "Play for resets on squishies—don’t get baited into 1v1.",
        "Punish after he uses R (he’s less sticky).",
      ],
    },
  },
};

// --- Generic fallback logic for champs without a custom entry ---
function genericScout(champName: string, selected: Selected): Scout {
  const n = norm(champName);

  const bullets: string[] = [];
  const tags: string[] = [];

  // Engage supports / hookers
  if (/(thresh|nautilus|leona|blitzcrank|pyke|rakan|rell|alistar)/.test(n)) {
    tags.push("Hard engage");
    bullets.push("Respect engage angles—don’t walk into their setup.");
    if (selected === "masteryi") bullets.push("Hold Q for their key CC, then commit after it’s used.");
  }

  // Poke / bind mages
  if (/(lux|morgana|zyra|xerath|velkoz|brand|vex|zoe)/.test(n)) {
    tags.push("Poke / pick");
    bullets.push("Play around their main skillshot—miss = punish window.");
    if (selected === "masteryi") bullets.push("Don’t Q into their CC—wait it out, then go.");
  }

  // Tanks
  if (/(mundo|ornn|sion|zac|rammus|malphite|sejuani|tahm|ksante)/.test(n)) {
    tags.push("Tank");
    bullets.push("Don’t tunnel early—plan %HP / sustained DPS if needed.");
  }

  // Healing
  if (/(soraka|yuumi|aatrox|vladimir|swain|warwick|sona|nami)/.test(n)) {
    tags.push("Healing");
    bullets.push("Anti-heal becomes valuable once fights start.");
  }

  // Default fallback
  if (bullets.length === 0) {
    bullets.push("Identify their key CC/escape and play around that cooldown.");
    if (selected === "masteryi") bullets.push("Look for resets: delete a squishy first, then snowball the fight.");
    if (selected === "volibear") bullets.push("Short trades → stack W mark → commit when you control the E zone.");
  }

  return {
    tags,
    title: "Quick notes",
    bullets,
  };
}

function pickScout(champ: DDragonChampion, selected: Selected): Scout {
  const key = norm(champ.name);
  const entry = SCOUT_MAP[key];
  if (!entry) return genericScout(champ.name, selected);
  return entry[selected] || entry.any || genericScout(champ.name, selected);
}

export function EnemyScout({ selected, enemies }: Props) {
  const scouts = useMemo(() => {
    return enemies.map((c) => ({ champ: c, scout: pickScout(c, selected) }));
  }, [enemies, selected]);

  if (enemies.length === 0) return null;

  return (
    <details className="scoutDetails">
      <summary className="scoutSummary">Enemy notes (tap to expand)</summary>

      <div className="scoutList">
        {scouts.map(({ champ, scout }) => (
          <div key={champ.id} className="scoutRow">
            <div className="scoutTop">
              <div className="scoutName">{champ.name}</div>
              {scout.tags && scout.tags.length > 0 && (
                <div className="scoutTags">
                  {scout.tags.map((t) => (
                    <span key={t} className="scoutTag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {scout.title && <div className="scoutTitle">{scout.title}</div>}

            <ul className="scoutBullets">
              {scout.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
