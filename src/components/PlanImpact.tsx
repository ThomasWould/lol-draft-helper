import { comparePlans } from "../recommendations/engine";
import type { ChampRec } from "../recommendations/types";
import { Icon } from "./Icon";

export function PlanImpact({
  baseline,
  rec,
}: {
  baseline: ChampRec;
  rec: ChampRec;
}) {
  const changes = comparePlans(baseline, rec);
  const total =
    changes.items.length +
    Number(changes.runesChanged) +
    Number(changes.startChanged);
  return (
    <details className="planImpact">
      <summary>
        <Icon name="compass" />
        <span>
          <b>What this draft changed</b>
          <small>
            {total
              ? `${total} ${total === 1 ? "adjustment" : "adjustments"} from the baseline setup`
              : "Baseline setup · no item, rune or starter changes triggered"}
          </small>
        </span>
        <Icon name="chevron" />
      </summary>
      <div className="impactBody">
        <p>
          Compared with this champion's default plan before any opponents are
          entered. Item order includes boots.
        </p>
        {changes.items.length > 0 && (
          <ul className="impactChanges">
            {changes.items.map((change) => (
              <li key={change.slot}>
                <span className="impactSlot">
                  {String(change.slot).padStart(2, "0")}
                </span>
                <div>
                  <span className="impactBefore">{change.before}</span>
                  <span className="impactAfter">
                    <Icon name="arrow" />
                    {change.after}
                  </span>
                  {change.note && <small>{change.note}</small>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {changes.runesChanged && (
          <div className="impactExtra">
            <Icon name="book" />
            Rune page adapted. Review the complete page before locking in.
          </div>
        )}
        {changes.startChanged && (
          <div className="impactExtra">
            <Icon name="spark" />
            Starting setup adapted to the lane matchup.
          </div>
        )}
        {!total && (
          <p className="impactExtra">
            No item, rune or starter changes are triggered. Your fight and wave
            advice can still adapt to specific opponents.
          </p>
        )}
        <p>
          These are draft-based adjustments. Check enemy purchases and the
          threats reaching you as the game develops.
        </p>
      </div>
    </details>
  );
}
