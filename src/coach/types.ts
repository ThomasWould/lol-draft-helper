import type { CHAMPIONS, ChampionKey } from "../recommendations/meta";

export type CoachContext = {
  patch: string;
  reviewedAt: string;
  championKey: ChampionKey;
  championLabel: (typeof CHAMPIONS)[ChampionKey]["label"];
  role: (typeof CHAMPIONS)[ChampionKey]["role"];
  enemyTeam: string[];
  alliedTeam?: string[];
  teamAdvice?: string[];
  buildStyle?: string;
  enemyTop?: string;
  enemyBot?: string; // raw text "Jinx, Leona" (optional)

  detected: {
    tanks: number;
    ccBurst: number;
    ap: number;
    ad: number;
    flex: number;
    healing: number;
    pills: string[];
  };

  recommendations: {
    headlineLines: string[];
    itemsOrdered: { name: string; note?: string }[];
    fightRule?: string;
    runes: string[];
    skillOrder: string;
    starter: string[];
  };
};
