import type { DDragonChampion } from "../api/ddragon";
import { META } from "../recommendations/meta";
import { GameIcon } from "./GameIcon";

export function LaneQuickPicks({
  candidates,
  selected,
  limit,
  onChange,
}: {
  candidates: DDragonChampion[];
  selected: DDragonChampion[];
  limit: number;
  onChange: (names: string) => void;
}) {
  if (!candidates.length) return null;
  return (
    <div className="laneQuickPicks">
      <span className="fieldHelp">
        Or choose from this draft{limit === 2 ? " (up to two)" : ""}:
      </span>
      <div>
        {candidates.slice(0, 5).map((champ) => {
          const active = selected.some((c) => c.id === champ.id);
          return (
            <button
              type="button"
              key={champ.id}
              aria-pressed={active}
              aria-label={`Use ${champ.name} in ${limit === 1 ? "top" : "bot"} matchup`}
              disabled={!active && limit === 2 && selected.length >= 2}
              onClick={() => {
                const next = active
                  ? selected.filter((c) => c.id !== champ.id)
                  : limit === 1
                    ? [champ]
                    : [...selected, champ];
                onChange(next.map((c) => c.name).join(", "));
              }}
            >
              <GameIcon
                label={champ.name}
                src={`https://ddragon.leagueoflegends.com/cdn/${META.dataVersion}/img/champion/${champ.image.full}`}
              />
              {champ.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
