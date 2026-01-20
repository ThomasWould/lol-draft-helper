// src/components/EnemyScout.tsx
import { useMemo } from "react";
import type { DDragonChampion } from "../api/ddragon";
import type { CoachContext } from "../coach/types";

type Selected = CoachContext["championKey"];

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

    // =========================
  // BEL'VETH: hard counters / must-respect
  // =========================

  poppy: {
    any: {
      tags: ["Anti-dash", "Disrupt"],
      title: "W stops dashes and can ruin engages.",
      bullets: [
        "Play around her W cooldown—don’t commit into it.",
        "Her R can eject you from fights/objectives if you enter early.",
      ],
    },
    belveth: {
      tags: ["Counter", "Patience"],
      title: "Poppy is a Bel’Veth check: you can’t just dive.",
      bullets: [
        "Do NOT Q-chain into her W—bait it first, then re-enter.",
        "If she’s holding R, don’t start objectives at low HP; she can knock you out and steal tempo.",
      ],
    },
  },

  rammus: {
    any: {
      tags: ["Tank", "Anti-AA"],
      title: "Armor + taunt punishes auto attackers.",
      bullets: [
        "Don’t hit into full Defensive Ball Curl if you can help it.",
        "QSS value goes up if you’re the main DPS.",
      ],
    },
    belveth: {
      tags: ["Avoid taunt", "Tempo"],
      title: "If he taunts you mid-fight, you can explode.",
      bullets: [
        "Track taunt timing—don’t be the first one in range.",
        "Consider early MR/tenacity choices depending on your build system; play for picks/side fights, not front-to-back into him.",
      ],
    },
  },

  jax: {
    any: {
      tags: ["Duelist", "Counterstrike"],
      title: "E blocks autos and turns your all-in.",
      bullets: [
        "Fight after Counterstrike ends; don’t commit into it.",
        "He scales well in sidelanes—don’t give free time.",
      ],
    },
    belveth: {
      tags: ["Wait E", "Skirmish"],
      title: "Your fights are about his E timing.",
      bullets: [
        "Hold re-engage until his E is down—then you can run him over with extended DPS.",
        "If he has E + Flash, don’t take ego 1v1s—convert to objectives instead.",
      ],
    },
  },

  lissandra: {
    any: {
      tags: ["Point&click", "Lockdown"],
      title: "Reliable lockdown sets up bursts.",
      bullets: [
        "Respect Flash-R range—she can start fights for free.",
        "If she uses E aggressively, that’s a punish window.",
      ],
    },
    belveth: {
      tags: ["Entry timing", "No front entry"],
      title: "Entering first usually means you get frozen and deleted.",
      bullets: [
        "Wait for her R usage before you hard-commit.",
        "If she’s fed, play fights slower: hover edges, then clean up after CDs are spent.",
      ],
    },
  },

  malzahar: {
    any: {
      tags: ["Suppression"],
      title: "Point-and-click suppression can decide fights.",
      bullets: [
        "Spell shield matters—pop it before committing.",
        "If you’re the carry, QSS timing is often required.",
      ],
    },
    belveth: {
      tags: ["QSS", "Don’t first in"],
      title: "If you get R’d mid-dive, you die.",
      bullets: [
        "Treat him like a ‘must-answer’ threat—plan QSS if you’re the win con.",
        "Let someone else trigger his R, then you enter and clean up.",
      ],
    },
  },

  skarner: {
    any: {
      tags: ["Pick", "Suppression"],
      title: "He can delete one carry by dragging them into his team.",
      bullets: [
        "Don’t fight in corridors without vision.",
        "Track ult; play around his engage angle.",
      ],
    },
    belveth: {
      tags: ["QSS", "Spacing"],
      title: "Getting grabbed mid-fight ends your reset chain.",
      bullets: [
        "You’re not allowed to be first into fog when R is up.",
        "If you’re snowballing, QSS can be worth a slot to keep tempo.",
      ],
    },
  },

  vi: {
    any: {
      tags: ["Point&click", "All-in"],
      title: "R is guaranteed engage and sets up burst.",
      bullets: [
        "Play around her R cooldown; don’t stand alone in front.",
        "After she commits, she’s often stuck—turn on her team’s backline.",
      ],
    },
    belveth: {
      tags: ["E timing", "Second entry"],
      title: "If you enter first, Vi picks you every time.",
      bullets: [
        "Hover edges and enter AFTER Vi R is used.",
        "Use E to absorb the burst window; then chase resets.",
      ],
    },
  },

  janna: {
    any: {
      tags: ["Disengage"],
      title: "She denies engages and resets fights.",
      bullets: [
        "Her ult can completely reset your dive—force it early if possible.",
        "Don’t telegraph engage paths (tornado).",
      ],
    },
    belveth: {
      tags: ["Patience", "Re-engage"],
      title: "You need a 2-wave fight: force disengage, then re-enter.",
      bullets: [
        "Don’t full-commit until you’ve seen R or tornado used.",
        "Play for flank angles; straight front entry gets peeled.",
      ],
    },
  },

  // =========================
  // HEIMERDINGER TOP: lane threats + turret answers
  // =========================

  irelia: {
    any: {
      tags: ["All-in", "Mobility"],
      title: "She can punish misposition and run you down.",
      bullets: [
        "Respect her stacked passive; don’t fight her at full stacks.",
        "Wave state matters—don’t let her farm to free engage.",
      ],
    },
    heimerdinger: {
      tags: ["Turret clear", "Danger lane"],
      title: "Hard matchup: she can clear turrets and all-in through them.",
      bullets: [
        "Keep turrets slightly back; don’t place them where she can Q-chain for free.",
        "Hold E to stop her first dash; if she gets on top of you, kite through turrets not away from them.",
      ],
    },
  },

  yasuo: {
    any: {
      tags: ["Windwall", "All-in"],
      title: "Windwall can block key skillshots; he thrives in extended fights.",
      bullets: [
        "Play around Windwall cooldown—don’t waste spells into it.",
        "Respect minion wave mobility.",
      ],
    },
    heimerdinger: {
      tags: ["Windwall", "Zone"],
      title: "Windwall can deny E follow-up; fight in turret zone.",
      bullets: [
        "Don’t panic cast E into Windwall—wait it out, then punish.",
        "Use turrets to control space; he hates walking into a set-up zone.",
      ],
    },
  },

  yone: {
    any: {
      tags: ["All-in", "Dive"],
      title: "Threat is his snap-back engage and ult setup.",
      bullets: [
        "Track E/ult cooldowns—those are his real windows.",
        "Don’t stand in a straight line vs R angles.",
      ],
    },
    heimerdinger: {
      tags: ["Anti-dive"],
      title: "He wants to dive through your setup—deny him the angle.",
      bullets: [
        "Keep turrets between you and his approach path; hold E for when he returns from E snapback.",
        "If he ults in, answer with R+E (stun/turn) or R+Q for zone depending on your kit usage.",
      ],
    },
  },

  tryndamere: {
    any: {
      tags: ["All-in", "Split"],
      title: "He spikes in sidelane and ignores death with R.",
      bullets: [
        "Don’t take long trades when he has fury + ghost.",
        "Your team needs a plan for his split push.",
      ],
    },
    heimerdinger: {
      tags: ["Anti-dive", "Wave"],
      title: "Your job is to deny dives and keep wave states safe.",
      bullets: [
        "Play closer to turret with set-up; don’t greed side lane without vision.",
        "Hold E for his spin/commit; he can’t dive cleanly if you stun the entry.",
      ],
    },
  },

  aatrox: {
    any: {
      tags: ["Sustain", "All-in"],
      title: "He wins extended fights with resets + healing.",
      bullets: [
        "Anti-heal helps once fights start.",
        "Respect sweet spots; don’t walk into Q edges repeatedly.",
      ],
    },
    heimerdinger: {
      tags: ["Kite", "Zone"],
      title: "Make him play through turrets—don’t meet him in open space.",
      bullets: [
        "Place turrets to force awkward Q angles; punish when he whiffs Q1/Q2.",
        "If he ults and runs at you, kite through your setup and look for E stun to turn.",
      ],
    },
  },

  olaf: {
    any: {
      tags: ["Runs at you", "Anti-CC"],
      title: "He ignores CC and wants straight-line fights.",
      bullets: [
        "Don’t rely on a single CC spell—he can ignore it.",
        "Kite and deny his axes if possible.",
      ],
    },
    heimerdinger: {
      tags: ["Don’t overextend"],
      title: "If you’re too far up, he can run you down through turrets.",
      bullets: [
        "Keep wave near your setup; don’t place turrets too far forward early.",
        "Use R+Q for zone control and kite; E stun is less reliable during his ult.",
      ],
    },
  },

  zac: {
    any: {
      tags: ["Engage", "Ganks"],
      title: "Long-range engage makes lanes volatile.",
      bullets: [
        "Respect fog + elastic slingshot angles.",
        "Deep wards matter more than usual.",
      ],
    },
    heimerdinger: {
      tags: ["Anti-gank"],
      title: "You’re strong when set up, weak when surprised.",
      bullets: [
        "Ward deeper than normal; keep turrets near you so ganks run through them.",
        "Hold E for Zac landing—stun on arrival wins the 2v2.",
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
    if (selected === "belveth") bullets.push("Don’t enter first—wait for key CC, then use E to soak burst and turn.");
    if (selected === "heimerdinger") bullets.push("Pre-place turrets and hold E to punish their engage path.");
  }


    // Poke / bind mages
  if (/(lux|morgana|zyra|xerath|velkoz|brand|vex|zoe)/.test(n)) {
    tags.push("Poke / pick");
    bullets.push("Play around their main skillshot—miss = punish window.");
    if (selected === "masteryi") bullets.push("Don’t Q into their CC—wait it out, then go.");
    if (selected === "belveth") bullets.push("Avoid face-checking—enter after key CC is used; E can blunt burst mid-fight.");
    if (selected === "heimerdinger") bullets.push("Use turret zone to deny poke angles; E stun sets up full turret beam damage.");
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

    if (selected === "masteryi") {
      bullets.push("Look for resets: delete a squishy first, then snowball the fight.");
    }

    if (selected === "belveth") {
      bullets.push("Play skirmish → objective: win 2v2/3v3, then convert to Herald/Baron form.");
      bullets.push("Teamfights: don’t front-enter—wait for CC, then E through burst and chase with resets.");
    }

    if (selected === "volibear") {
      bullets.push("Short trades → stack W mark → commit when you control the E zone.");
    }

    if (selected === "heimerdinger") {
      bullets.push("Pre-setup turrets before trades; fight inside your turret zone.");
      bullets.push("Hold E for stun punish; R+E is your pick/turn tool, R+Q is best for zoning objectives.");
    }
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
