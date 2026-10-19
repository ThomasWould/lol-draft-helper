import type { DDragonChampion } from './api/ddragon';

export const normalizeLoose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export const splitTokens = (raw: string) => raw.split(/,|\n/).map(s => s.trim()).filter(Boolean);
const aliases: Record<string, string> = { wukong: 'monkeyking', nunu: 'nunu', mundo: 'drmundo' };
const canonical = (s: string) => aliases[normalizeLoose(s)] ?? normalizeLoose(s);

export function resolveChampions(tokens: string[], championList: DDragonChampion[]) {
  const lookup = new Map(championList.flatMap(c => [[canonical(c.name), c], [canonical(c.id), c]] as const));
  const matched: DDragonChampion[] = [];
  const unmatched: string[] = [];
  for (const token of tokens) {
    const found = lookup.get(canonical(token));
    if (!found) unmatched.push(token);
    else if (!matched.some(c => c.id === found.id)) matched.push(found);
  }
  return { matched, unmatched };
}

export function removeEnemy(champ: DDragonChampion, raw: string) {
  const names = new Set([canonical(champ.name), canonical(champ.id)]);
  return splitTokens(raw).filter(t => !names.has(canonical(t))).join(', ');
}
