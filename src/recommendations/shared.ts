import type { DraftTags } from './tags';
import type { OrderedItem } from './types';
export const hasAny = (enemies: string[], keys: string[]) => enemies.some(e => keys.includes(e));
// Vi R is airborne; Mordekaiser R cannot be cleansed.
export const needsQSS = (enemies: string[]) => hasAny(enemies, ['malzahar', 'skarner', 'warwick']);
export function carryBoots(tags: DraftTags, fallback = "Berserker's Greaves") {
  if (tags.heavyAD) return 'Plated Steelcaps';
  if (tags.heavyAP) return "Mercury's Treads";
  return fallback;
}
export const jungleStart = 'PATH: Choose your start to finish toward lane priority; ward entrances and adapt to invades. Blue is not inherently safer.';
// Replace the final flex slot, rather than inserting a seventh item and truncating.
export function withCleanse(items: OrderedItem[], enemies: string[]): OrderedItem[] {
  if (!needsQSS(enemies)) return items;
  return [...items.slice(0, 5), {
    name: 'Mercurial Scimitar',
    note: 'Buy Quicksilver Sash before fights if suppression stops you; finish later. Replaces final flex slot.',
  }];
}
export const cleanseAdvice = 'Quicksilver Sash removes suppression; Cleanse and tenacity do not. QSS does not remove knockups or Mordekaiser R. Buy for the threat actually stopping you.';
