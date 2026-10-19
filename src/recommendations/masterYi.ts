import type { DraftTags } from './tags';
import type { ChampRec, OrderedItem } from './types';
import { carryBoots, cleanseAdvice, jungleStart, withCleanse } from './shared';
export function getMasterYiRec(tags: DraftTags, enemies: string[] = []): ChampRec {
  const onHit = tags.tanky;
  const runes = onHit ? [
    'Precision: Lethal Tempo / Triumph / Legend: Alacrity / Cut Down',
    'Domination: Grisly Mementos / Treasure Hunter',
  ] : [
    'Domination: Hail of Blades / Sudden Impact / Grisly Mementos / Treasure Hunter',
    'Precision: Legend: Alacrity / Triumph',
  ];
  const base: OrderedItem[] = onHit ? [
    { name: 'Kraken Slayer' }, { name: carryBoots(tags) },
    { name: 'Blade of the Ruined King', note: 'HP damage; armor still reduces its physical on-hit.' },
    { name: "Guinsoo's Rageblade" },
    { name: tags.heavyAP ? "Wit's End" : "Death's Dance", note: 'MR versus magic damage; armor versus physical threats.' },
    { name: 'Guardian Angel' },
  ] : [
    { name: 'Kraken Slayer' }, { name: carryBoots(tags) }, { name: 'The Collector' },
    { name: tags.healing ? 'Mortal Reminder' : "Lord Dominik's Regards", note: 'Choose one Last Whisper upgrade; inspect enemy armor.' },
    { name: 'Infinity Edge' }, { name: 'Immortal Shieldbow' },
  ];
  const items = withCleanse(base, enemies);
  return {
    headlineLines: [
      `RUNES: ${onHit ? 'Lethal Tempo — extended fights into multiple frontliners (draft adjustment)' : 'Hail of Blades — current popular crit setup'}`,
      `BUILD: ${onHit ? 'On-hit alternative: Kraken → BORK → Rageblade' : 'Crit: Kraken → Collector → Last Whisper upgrade → Infinity Edge'}`,
      'W POINTS: One early point; max Q > E > W. Extra W is a situational survival tradeoff.', jungleStart,
    ],
    itemsOrdered: items,
    fightRule: 'Wait for key lockdown, enter second, hold Q to dodge a spell or follow movement, then chain takedown resets. W reduces burst; it does not make you immune to CC.',
    bans: ['Rammus', 'Elise', "Rek'Sai", 'Zac'],
    runes: [...runes, 'Shards: Attack Speed / Adaptive Force / Scaling Health'],
    skillOrder: 'Q > E > W; R whenever available. Typical opening Q → E → W.',
    starter: ['Gustwalker Hatchling; optional Health Potion within starting gold', 'Smite + Flash'],
    coreItems: items.map(x => x.name),
    situational: [cleanseAdvice,
      'Mercury’s Treads help against magic damage and reducible CC; they do not shorten suppression or knockups.',
      "Swap late damage for Guardian Angel, Death's Dance against physical threats, or MR against magic threats. Wit's End provides MR, not armor.",
    ],
    notes: ['Cut Down rewards attacking high-health targets; it is not an enemy max-HP comparison rune.', 'The two-frontliner switch is a draft heuristic, not a measured matchup win-rate claim.'],
  };
}
