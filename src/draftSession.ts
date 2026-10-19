import { CHAMPIONS, type ChampionKey } from "./recommendations/meta";
import { supportsBuildStyle, type BuildStyle } from "./recommendations/styles";

export type DraftSession = {
  selected: ChampionKey;
  enemyRaw: string;
  enemyTopRaw: string;
  enemyBotRaw: string;
  alliesRaw?: string;
  buildStyle?: BuildStyle;
};
export function validateDraftSession(value: unknown): DraftSession | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.selected !== "string" || !Object.hasOwn(CHAMPIONS, v.selected))
    return null;
  if (
    !["enemyRaw", "enemyTopRaw", "enemyBotRaw"].every(
      (k) => typeof v[k] === "string" && v[k].length <= 2000,
    )
  )
    return null;
  if (
    v.alliesRaw !== undefined &&
    (typeof v.alliesRaw !== "string" || v.alliesRaw.length > 2000)
  )
    return null;
  if (
    v.buildStyle !== undefined &&
    !supportsBuildStyle(v.selected as ChampionKey, v.buildStyle)
  )
    return null;
  return {
    selected: v.selected as ChampionKey,
    enemyRaw: v.enemyRaw as string,
    enemyTopRaw: v.enemyTopRaw as string,
    enemyBotRaw: v.enemyBotRaw as string,
    alliesRaw: (v.alliesRaw as string | undefined) ?? "",
    buildStyle: (v.buildStyle as BuildStyle | undefined) ?? "auto",
  };
}
