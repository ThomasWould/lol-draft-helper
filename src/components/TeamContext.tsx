import type { analyzeTeam } from "../recommendations/team";
import { GameIcon } from "./GameIcon";
import { Icon } from "./Icon";
import { META } from "../recommendations/meta";

export function TeamContext({
  team,
}: {
  team: ReturnType<typeof analyzeTeam>;
}) {
  return (
    <section className="teamContext" aria-label="Allied team plan">
      <div className="teamHeading">
        <span className="eyebrow">
          <Icon name="shield" /> YOUR SIDE OF THE DRAFT
        </span>
        <span>{team.members.length} / 5 known</span>
      </div>
      <div className="teamRoster">
        {team.members.map((champ) => (
          <span key={champ.id}>
            <GameIcon
              label={champ.name}
              src={`https://ddragon.leagueoflegends.com/cdn/${META.dataVersion}/img/champion/${champ.image.full}`}
            />
            {champ.name}
          </span>
        ))}
      </div>
      <div className="teamSignals">
        <span>{team.counts.frontline} frontline profiles</span>
        <span>{team.counts.control} control kits</span>
        <span>
          {team.counts.physical} physical · {team.counts.magic} magic ·{" "}
          {team.counts.mixed} mixed
        </span>
      </div>
      <ul>
        {team.advice.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="teamCaveat">
        {team.complete
          ? "Five known picks."
          : "Partial team: the remaining picks can change the plan."}{" "}
        Kit profiles are estimates, not measured damage shares or a
        team-strength score.
      </p>
    </section>
  );
}
