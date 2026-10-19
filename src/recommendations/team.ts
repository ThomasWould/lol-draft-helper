import type { DDragonChampion } from "../api/ddragon";
import { normalizeLoose } from "../draft";
import { buildChampionTraitsMap } from "./championTraits";
import type { ChampionKey } from "./meta";

const ENGAGERS = new Set([
  "malphite",
  "leona",
  "nautilus",
  "rell",
  "alistar",
  "amumu",
  "sejuani",
  "zac",
  "ornn",
  "maokai",
  "rakan",
  "vi",
  "skarner",
  "wukong",
  "monkeyking",
]);
const PROTECTORS = new Set([
  "lulu",
  "janna",
  "milio",
  "braum",
  "tahmkench",
  "taric",
  "renata",
  "soraka",
  "nami",
  "sona",
  "ivern",
  "yuumi",
]);
export function analyzeTeam(
  selected: ChampionKey,
  teammates: DDragonChampion[],
  roster: DDragonChampion[],
) {
  const traits = buildChampionTraitsMap(roster);
  const player = roster.find((c) => normalizeLoose(c.name) === selected);
  const members = player ? [player, ...teammates] : teammates;
  const counts = { physical: 0, magic: 0, mixed: 0, frontline: 0, control: 0 };
  for (const champ of members) {
    const t = traits.get(normalizeLoose(champ.name));
    if (!t) continue;
    counts[
      t.damage === "AD" ? "physical" : t.damage === "AP" ? "magic" : "mixed"
    ]++;
    if (t.tanky) counts.frontline++;
    if (t.heavyCC) counts.control++;
  }
  const engagers = teammates
    .filter(
      (c) =>
        ENGAGERS.has(normalizeLoose(c.name)) ||
        ENGAGERS.has(normalizeLoose(c.id)),
    )
    .map((c) => c.name);
  const protectors = teammates
    .filter((c) => PROTECTORS.has(normalizeLoose(c.name)))
    .map((c) => c.name);
  const advice: string[] = [];
  if (teammates.length) {
    const lead = engagers.slice(0, 2).join(" / ");
    const resetCarry = selected === "masteryi" || selected === "belveth";
    if (lead)
      advice.push(
        selected === "volibear"
          ? `Coordinate entry with ${lead}; stagger your control instead of spending every engage tool at once.`
          : resetCarry
            ? `Let ${lead} commit first. Follow once enemy lockdown is spent, then use takedowns to keep the fight moving.`
            : selected === "missfortune"
              ? `Follow ${lead}'s control with Bullet Time from a safe angle. Keep distance so the same engage cannot interrupt your channel.`
              : `Follow ${lead}'s control from your prepared position; keep your defensive spell available for threats reaching your backline.`,
      );
    else
      advice.push(
        selected === "volibear"
          ? "Be deliberate about starting fights: check that teammates can reach your target before committing Q or R."
          : "No reviewed engager among the known teammates. Work from vision, poke or an enemy mistake rather than assuming someone can start the fight for you.",
      );
    if (protectors.length)
      advice.push(
        `Stay within reach of ${protectors.slice(0, 2).join(" / ")} when playing for protection. A deep chase can separate you from their help.`,
      );
    if (!counts.frontline)
      advice.push(
        "No frontline profile in the known picks. Use range, terrain and short windows; avoid gathering for a stationary front-to-back fight without a safe position.",
      );
    if (counts.physical >= 3 && counts.magic === 0)
      advice.push(
        "Known kit profiles lean physical. Watch for armor purchases; coordinate target selection and reassess penetration against actual items.",
      );
    if (counts.magic >= 3 && counts.physical === 0)
      advice.push(
        "Known kit profiles lean magic. Watch for MR purchases; create access for any physical damage teammate instead of stacking into the same defended target.",
      );
  }
  return {
    members,
    counts,
    engagers,
    protectors,
    advice,
    complete: teammates.length === 4,
  };
}
