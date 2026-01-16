export type CoachContext = {
  championKey: "masteryi" | "belveth" | "volibear" | "heimerdinger";
  championLabel: "Master Yi" | "Bel'Veth" | "Volibear" | "Heimerdinger";
  role: "Jungle" | "Top";
  // rest same...
  enemyTeam: string[];
  enemyTop?: string;

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
  };
};

