export type OrderedItem = { name: string; note?: string };
export type ChampRec = {
  headlineLines: string[];
  itemsOrdered: OrderedItem[];
  fightRule?: string;
  bans?: string[];
  waveTips?: { title: string; bullets: string[] };
  runes: string[];
  skillOrder: string;
  starter: string[];
  coreItems: string[];
  situational: string[];
  notes: string[];
};
