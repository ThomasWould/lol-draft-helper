export type CoachContext = {
  championKey: "masteryi" | "volibear";
  championLabel: string; // "Master Yi" | "Volibear"
  role: string;          // "Jungle" | "Top"

  enemyTeam: string[];   // ["Kayle", "Lux", ...] from matched champs
  enemyTop?: string;     // from enemyTopRaw (optional)

  detected: {
    tanks: number;
    ccBurst: number;
    ap: number;
    ad: number;
    flex: number;
    healing: number;
    pills: string[];     // tagsToPills(tags)
  };

  recommendations: {
    headlineLines: string[]; // your recLines (RUNES/START/etc)
    itemsOrdered: { name: string; note?: string }[];
    fightRule?: string;
  };
};
