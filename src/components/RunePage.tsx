import { findRune, parseRuneLine } from "../recommendations/runes";
import { GameIcon } from "./GameIcon";

export function RunePage({ lines }: { lines: string[] }) {
  return (
    <div className="runePage">
      {lines.map((line, index) => {
        const { tree, names } = parseRuneLine(line);
        if (tree === "Shards")
          return (
            <p className="runeShards" key={line}>
              <span className="label">Shards</span>
              {names.join(" · ")}
            </p>
          );
        return (
          <div className="runeTree" key={line}>
            <div className="runeTreeHeading">
              <span className="label">{tree}</span>
              <span>{index === 0 ? "PRIMARY" : "SECONDARY"}</span>
            </div>
            <div className="runeChoices">
              {names.map((name) => {
                const rune = findRune(name);
                return (
                  <div
                    key={name}
                    className={`runeChoice ${rune?.slot === 0 ? "keystone" : ""}`}
                  >
                    <GameIcon
                      label={name}
                      src={
                        rune &&
                        `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
                      }
                    />
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
