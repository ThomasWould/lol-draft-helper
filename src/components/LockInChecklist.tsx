import { useState } from "react";
import type { ChampRec } from "../recommendations/types";
import { Icon } from "./Icon";
import { RunePage } from "./RunePage";

export function LockInChecklist({ rec }: { rec: ChampRec }) {
  const [checked, setChecked] = useState<string[]>([]);
  const tasks = [
    "Rune page set",
    "Summoner spells checked",
    "First buy planned",
  ];
  return (
    <section className="lockInSetup" aria-label="Lock-in preparation">
      <div className="setupHeading">
        <div>
          <span className="eyebrow">BE READY AT LEVEL ONE</span>
          <h3>Your opening setup</h3>
        </div>
        <Icon name="spark" />
      </div>
      <div className="setupGrid">
        <div className="setupRunes">
          <span className="label">Rune page</span>
          <RunePage lines={rec.runes} />
        </div>
        <div>
          <span className="label">Skill order</span>
          <p>{rec.skillOrder}</p>
          <span className="label">Start & spells</span>
          {rec.starter.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <div className="checklistHeading">
        <span className="label">LOCK-IN CHECKLIST</span>
        <span aria-live="polite">
          {checked.length === 3
            ? "Ready for the Rift"
            : `${checked.length} / 3 ready`}
        </span>
      </div>
      <div className="checklist">
        {tasks.map((task) => (
          <label
            key={task}
            className={checked.includes(task) ? "complete" : ""}
          >
            <input
              type="checkbox"
              checked={checked.includes(task)}
              onChange={(e) =>
                setChecked((prev) =>
                  e.target.checked
                    ? [...prev, task]
                    : prev.filter((t) => t !== task),
                )
              }
            />
            <span>{task}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
