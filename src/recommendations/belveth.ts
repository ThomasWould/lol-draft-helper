import type { DraftTags } from './tags';
import type { ChampRec, OrderedItem } from './types';
import { carryBoots, cleanseAdvice, jungleStart, withCleanse } from './shared';
export function getBelvethRec(tags: DraftTags, enemies: string[] = []): ChampRec {
  const base: OrderedItem[] = [
    { name: 'Kraken Slayer' }, { name: carryBoots(tags, 'Plated Steelcaps') },
    { name: 'Blade of the Ruined King' },
    { name: tags.heavyAP ? "Wit's End" : "Death's Dance" },
    { name: 'Terminus', note: 'Sustained combat penetration; do not combine with restricted penetration items.' },
    { name: 'Guardian Angel' },
  ];
  const items = withCleanse(base, enemies);
  return {
    headlineLines: [
      'RUNES: Press the Attack / Triumph / Legend: Alacrity / Coup de Grace',
      'SECONDARY: Cash Back + Triple Tonic; Lethal Tempo is an extended-fight alternative.',
      'EARLY: Protect your clear and stacks. The 26.15 update reduced early invade power and improved scaling.', jungleStart,
    ],
    itemsOrdered: items,
    fightRule: 'Enter after key CC, use W to set up damage and E for a planned burst window. Secure coral safely and convert won fights into objectives. Avoid forced early invades on old-kit assumptions.',
    bans: ['Rammus', 'Jax', 'Poppy', 'Warwick'],
    runes: ['Precision: Press the Attack / Triumph / Legend: Alacrity / Coup de Grace', 'Inspiration: Cash Back / Triple Tonic', 'Shards: Adaptive Force / Adaptive Force / Scaling Health'],
    skillOrder: 'Q > E > W; R whenever available.',
    starter: ['Jungle companion; optional Health Potion within starting gold', 'Smite + Flash'],
    coreItems: items.map(x => x.name),
    situational: [cleanseAdvice, 'Stridebreaker is a sticking-power alternative, not a mandatory second item.', 'Choose defenses for the damage reaching you; do not automatically buy both armor and MR.'],
    notes: ['Since 26.15, True Form duration scales with passive stacks, becoming indefinite until death at 80 stacks. Early Q recasts are spaced further apart.', 'R passive applies on every attack and persists through target swaps; prioritize sustained uptime.'],
  };
}
