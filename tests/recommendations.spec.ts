import { test, expect } from '@playwright/test';
import champions from '../src/data/champions.json' with { type: 'json' };
import itemNames from './fixtures/items-16.20.1.json' with { type: 'json' };
import { getDraftTagsFromTraits, type DraftTags } from '../src/recommendations/tags';
import { getMasterYiRec } from '../src/recommendations/masterYi';
import { getBelvethRec } from '../src/recommendations/belveth';
import { getVolibearRec } from '../src/recommendations/volibear';
import { getHeimerdingerRec } from '../src/recommendations/heimerdinger';
import { getMissFortuneRec } from '../src/recommendations/missFortune';
import { getLuxSupportRec } from '../src/recommendations/lux';
import { needsQSS } from '../src/recommendations/shared';
import { matchesReviewedPatch } from '../src/recommendations/meta';
import { resolveChampions, removeEnemy } from '../src/draft';
import { validateRunePage } from '../src/recommendations/runes';

const roster = Object.values(champions);
const blank = getDraftTagsFromTraits([], roster);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

test('all build branches produce six unique, live Summoner’s Rift items', () => {
  const builders = [getMasterYiRec, getBelvethRec, getVolibearRec, getHeimerdingerRec, getMissFortuneRec, getLuxSupportRec];
  const catalog = new Set(itemNames.map(norm));
  for (let mask = 0; mask < 64; mask++) {
    const flags = ['tanky', 'heavyCCBurst', 'heavyAP', 'heavyAD', 'healing', 'rangedTop'] as const;
    const tags: DraftTags = { ...blank };
    flags.forEach((key, bit) => { tags[key] = Boolean(mask & (1 << bit)); });
    for (const enemies of [[], ['malzahar', 'vi', 'jinx', 'warwick', 'soraka'], ['mordekaiser', 'poppy', 'jax']]) {
      for (const build of builders) {
        const rec = build(tags, enemies);
        const names = rec.itemsOrdered.map(x => norm(x.name));
        expect(names, build.name).toHaveLength(6);
        expect(new Set(names).size, build.name).toBe(6);
        for (const name of names) expect(catalog.has(name), `${build.name}: ${name}`).toBeTruthy();
        expect(names.filter(n => [norm("Lord Dominik's Regards"), norm('Mortal Reminder'), norm('Terminus'), norm('Serylda’s Grudge')].includes(n)).length).toBeLessThanOrEqual(1);
        expect(rec.runes.length).toBeGreaterThan(1);
        expect(validateRunePage(rec.runes), `${build.name}: legal rune page`).toEqual([]);
      }
    }
  }
});

test('QSS is targeted to suppression and preserves the finished inventory', () => {
  for (const enemy of ['vi', 'mordekaiser']) {
    expect(needsQSS([enemy])).toBeFalsy();
    expect(getMasterYiRec(blank, [enemy]).itemsOrdered.some(x => /Mercurial/.test(x.name))).toBeFalsy();
  }
  for (const enemy of ['malzahar', 'skarner', 'warwick']) {
    expect(needsQSS([enemy])).toBeTruthy();
    const rec = getMasterYiRec(blank, [enemy]);
    expect(rec.itemsOrdered.at(-1)?.name).toBe('Mercurial Scimitar');
    expect(rec.itemsOrdered.some(x => x.name === 'Infinity Edge')).toBeTruthy();
  }
});

test('Yi separates the popular crit baseline from the on-hit alternative', () => {
  expect(getMasterYiRec(blank).headlineLines[0]).toContain('Hail of Blades');
  expect(getMasterYiRec({ ...blank, tanky: true }).itemsOrdered.map(x => x.name)).toContain("Guinsoo's Rageblade");
  expect(getMissFortuneRec({ ...blank, healing: true }).itemsOrdered.map(x => x.name)).not.toContain("Lord Dominik's Regards");
});

test('traits classify AP assassins, preserve flex names, and deduplicate enemies', () => {
  const tags = getDraftTagsFromTraits(['akali', 'evelynn', 'fizz', 'jax', 'jax'], roster);
  expect(tags.counts.ap).toBe(3);
  expect(tags.heavyAP).toBeTruthy();
  expect(tags.counts.flexNames).toEqual(['jax']);
  expect(tags.counts.tanks).toBe(0);
  expect(getDraftTagsFromTraits(['rell', 'ornn'], roster).heavyCCBurst).toBeTruthy();
});

test('aliases and duplicate inputs resolve and remove together', () => {
  const resolved = resolveChampions(['MonkeyKing', 'Wukong', 'Mundo', 'bad input'], roster);
  expect(resolved.matched.map(c => c.name)).toEqual(['Wukong', 'Dr. Mundo']);
  expect(resolved.unmatched).toEqual(['bad input']);
  expect(removeEnemy(resolved.matched[0], 'MonkeyKing, Wukong, Lux')).toBe('Lux');
});

test('patch freshness compares the Data Dragon release, not the marketing year', () => {
  expect(matchesReviewedPatch('16.20.2')).toBeTruthy();
  expect(matchesReviewedPatch('16.21.1')).toBeFalsy();
});

test('champion matching does not confuse Vi with Anivia or Viktor', () => {
  const ordinary = getLuxSupportRec(blank, ['anivia', 'viktor']);
  expect(ordinary.itemsOrdered.map(x => x.name)).not.toContain("Zhonya's Hourglass");
  expect(getLuxSupportRec(blank, ['vi']).itemsOrdered.map(x => x.name)).toContain("Zhonya's Hourglass");
});

test('rune validation catches removed runes, duplicate slots and secondary keystones', () => {
  const primary = 'Precision: Press the Attack / Triumph / Legend: Alacrity / Coup de Grace';
  expect(validateRunePage([primary, 'Domination: Eyeball Collection / Treasure Hunter'])).not.toEqual([]);
  expect(validateRunePage([primary, 'Resolve: Second Wind / Bone Plating'])).not.toEqual([]);
  expect(validateRunePage([primary, 'Sorcery: Arcane Comet / Gathering Storm'])).not.toEqual([]);
  expect(getVolibearRec({ ...blank, rangedTop: true }, []).runes[1]).toContain('Second Wind');
});
