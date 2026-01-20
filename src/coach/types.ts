export type CoachContext = {
  championKey: "masteryi" | "belveth" | "volibear" | "heimerdinger"|"missfortune"|"lux";
  championLabel: "Master Yi" | "Bel'Veth" | "Volibear" | "Heimerdinger" | "Miss Fortune" | "Lux";
  role: "Jungle" | "Top" | "ADC" | "Support";
  // rest same...
  enemyTeam: string[];
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
  };
};

