import { BUILD_STYLES, type BuildStyle } from "../recommendations/styles";
import type { ChampionKey } from "../recommendations/meta";

export function BuildStylePicker({
  champion,
  value,
  onChange,
}: {
  champion: ChampionKey;
  value: BuildStyle;
  onChange: (style: BuildStyle) => void;
}) {
  const options = BUILD_STYLES[champion];
  const chosen = options.find((option) => option.id === value) ?? options[0];
  return (
    <div className="buildStylePicker">
      <span className="label">Build style</span>
      {options.length > 1 ? (
        <div className="styleOptions" role="group" aria-label="Build style">
          {options.map((option) => (
            <button
              type="button"
              key={option.id}
              aria-pressed={value === option.id}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="fieldHelp">Automatic · reviewed setup</p>
      )}
      <p className="styleDescription">{chosen.description}</p>
    </div>
  );
}
