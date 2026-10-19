import { test, expect, type Page } from '@playwright/test';
import champions from '../src/data/champions.json' with { type: 'json' };

async function mockData(page: Page, version = '16.20.1') {
  await page.route('**/api/versions.json', route => route.fulfill({ json: [version] }));
  await page.route('**/data/en_US/champion.json', route => route.fulfill({ json: { data: champions } }));
  await page.route('**/img/champion/**', route => route.abort());
}

test('all six champions expose current builds, correct coach titles and full details', async ({ page }) => {
  await mockData(page);
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Enemy team', exact: true }).fill('Lux');
  for (const [key, title, item] of [
    ['masteryi', 'Master Yi Jungle', 'The Collector'],
    ['belveth', "Bel'Veth Jungle", 'Blade of the Ruined King'],
    ['volibear', 'Volibear Top', 'Dusk and Dawn'],
    ['heimerdinger', 'Heimerdinger Top', 'Blackfire Torch'],
    ['missfortune', 'Miss Fortune ADC', 'Hubris'],
    ['lux', 'Lux Support', "Luden's Echo"],
  ]) {
    await page.getByRole('combobox').selectOption(key);
    await expect(page.locator('.coachDockSub')).toContainText(title);
    await expect(page.locator('.itemName').filter({ hasText: item })).toBeVisible();
    await expect(page.locator('.itemRow')).toHaveCount(6);
    await expect(page.getByRole('link', { name: 'Build source' })).toHaveAttribute('href', /mobalytics/);
  }
  await page.getByText('Full runes, skills & situational advice').click();
  await expect(page.locator('.recDetails')).toContainText('Cheap Shot');
});

test('bot-only input feeds traits, recommendations, scouting and coach; clear all works', async ({ page }) => {
  await mockData(page);
  let payload: { context: { enemyTeam: string[]; patch: string; enemyBot: string } } | undefined;
  await page.route('**/api/coach', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { text: 'Test response' } });
  });
  await page.goto('/');
  await page.getByRole('combobox').selectOption('missfortune');
  await page.getByRole('textbox', { name: 'Enemy bot lane' }).fill('Leona, Soraka');
  await expect(page.locator('.detHeal')).toContainText('1 healing');
  await expect(page.locator('.itemName').filter({ hasText: 'Mortal Reminder' })).toBeVisible();
  await expect(page.locator('.coachDockSub')).toContainText('2 enemies');
  await page.getByRole('textbox', { name: 'Ask coach' }).fill('How should I play lane?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.coachBubble').last()).toHaveText('Test response');
  expect(payload?.context.enemyTeam).toEqual(['Leona', 'Soraka']);
  expect(payload?.context.patch).toBe('26.20');
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByRole('textbox', { name: 'Enemy bot lane' })).toHaveValue('');
  await expect(page.locator('.itemRow')).toHaveCount(0);
});

test('invalid top does not count as a draft and inactive lane fields do not leak', async ({ page }) => {
  await mockData(page);
  await page.goto('/');
  await page.getByRole('combobox').selectOption('volibear');
  await page.getByRole('textbox', { name: 'Enemy top', exact: true }).fill('typo');
  await expect(page.locator('.itemRow')).toHaveCount(0);
  await expect(page.getByText('Lane not recognized: typo')).toBeVisible();
  await page.getByRole('textbox', { name: 'Enemy top', exact: true }).fill('Teemo');
  await expect(page.locator('.itemRow')).toHaveCount(6);
  await page.getByRole('combobox').selectOption('masteryi');
  await expect(page.locator('.itemRow')).toHaveCount(0);
  await expect(page.locator('.coachDockSub')).not.toContainText('Teemo');
});

test('duplicates and excess enemies do not inflate analysis', async ({ page }) => {
  await mockData(page);
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Enemy team', exact: true }).fill('Lux, Lux, Leona, Rammus, Amumu, Teemo, Soraka');
  await expect(page.locator('.coachDockSub')).toContainText('5 enemies');
  await expect(page.getByText(/A draft has five enemies/)).toBeVisible();
  await expect(page.locator('.detHeal')).toHaveCount(0);
});

test('offline bundled roster remains usable with storage denied', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.route('**/api/versions.json', route => route.abort());
  await page.goto('/');
  await expect(page.getByText(/using bundled champion data/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Enemy team', exact: true }).fill('Malzahar');
  await expect(page.locator('.itemName').filter({ hasText: 'Mercurial Scimitar' })).toBeVisible();
});

test('corrupt cache is ignored and successful live refresh survives storage failure', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ddragon_champs_v2', JSON.stringify({ version: '16.19.1', savedAt: 1, champMap: { Invalid: {} } }));
    Storage.prototype.setItem = () => { throw new Error('quota'); };
  });
  await mockData(page);
  await page.goto('/');
  await expect(page.getByText('Loading champion data…')).toHaveCount(0);
  await expect(page.getByText(/Live refresh failed/)).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Enemy team', exact: true }).fill('Lux');
  await expect(page.locator('.itemRow')).toHaveCount(6);
});

test('a later data patch produces a visible review warning', async ({ page }) => {
  await mockData(page, '16.21.1');
  await page.goto('/');
  await expect(page.getByText(/differs from reviewed patch 26.20/)).toBeVisible();
});

test('coach HTTP errors report failure', async ({ page }) => {
  await mockData(page);
  await page.route('**/api/coach', route => route.fulfill({ status: 503, json: { error: 'Unavailable' } }));
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Ask coach' }).fill('Plan?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.coachBubble').last()).toHaveText('Error reaching coach API. Try again.');
});

test('mobile draft and expanded details fit the viewport', async ({ page }) => {
  await mockData(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Enemy team', exact: true }).fill('Malzahar, Warwick, Leona, Rammus, Lux');
  await page.getByText('Full runes, skills & situational advice').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: test.info().outputPath('mobile-draft.png'), fullPage: true });
});
