import type { ChampionKey } from "./meta";

export type BuildStyle =
  | "auto"
  | "crit"
  | "onhit"
  | "pta"
  | "tempo"
  | "conqueror"
  | "comet"
  | "firststrike";
type StyleOption = { id: BuildStyle; label: string; description: string };
const AUTO: StyleOption = {
  id: "auto",
  label: "Automatic",
  description:
    "Use the reviewed baseline and automatic enemy-draft adjustments.",
};
export const BUILD_STYLES: Record<ChampionKey, readonly StyleOption[]> = {
  masteryi: [
    AUTO,
    {
      id: "crit",
      label: "Crit burst",
      description:
        "Hail of Blades with Collector and crit scaling. Short damage windows; less sustained frontline damage than the on-hit alternative.",
    },
    {
      id: "onhit",
      label: "On-hit sustain",
      description:
        "Lethal Tempo with BORK and Rageblade. Needs attack uptime; defensive and anti-suppression slots still adapt.",
    },
  ],
  belveth: [
    AUTO,
    {
      id: "pta",
      label: "Press the Attack",
      description:
        "Reviewed baseline rune page for focused trades. Item defenses still adapt to the draft.",
    },
    {
      id: "tempo",
      label: "Extended fights",
      description:
        "Lethal Tempo alternative for longer attack windows. Keeps the reviewed item core; this is a deliberate playstyle choice.",
    },
  ],
  heimerdinger: [
    AUTO,
    {
      id: "conqueror",
      label: "Sustained pressure",
      description:
        "Conqueror baseline for sustained turret fights, with Presence of Mind and Legend: Haste.",
    },
    {
      id: "comet",
      label: "Poke pressure",
      description:
        "Arcane Comet alternative for ranged poke. Changes the complete rune page; defensive items still adapt.",
    },
  ],
  missfortune: [
    AUTO,
    {
      id: "firststrike",
      label: "First Strike",
      description:
        "Reviewed burst and ultimate setup. Getting hit first can deny its value; position for clean openings.",
    },
    {
      id: "pta",
      label: "Auto-attack trades",
      description:
        "Press the Attack alternative for sustained trades. Keeps the Hubris/crit item core and matchup-based starting items.",
    },
  ],
  volibear: [AUTO],
  lux: [AUTO],
};
export function supportsBuildStyle(
  champion: ChampionKey,
  value: unknown,
): value is BuildStyle {
  return BUILD_STYLES[champion].some((style) => style.id === value);
}
