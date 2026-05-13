import { test, expect, type Page, type Route } from '@playwright/test';

const version = '13.1.1';
const championData = {
  data: {
    Volibear: {
      id: 'Volibear',
      key: '106',
      name: 'Volibear',
      image: { full: 'Volibear.png' },
      tags: ['Fighter', 'Tank'],
      stats: { attackrange: 125 },
    },
    'Master Yi': {
      id: 'MasterYi',
      key: '11',
      name: 'Master Yi',
      image: { full: 'MasterYi.png' },
      tags: ['Assassin', 'Fighter'],
      stats: { attackrange: 125 },
    },
    Darius: {
      id: 'Darius',
      key: '122',
      name: 'Darius',
      image: { full: 'Darius.png' },
      tags: ['Fighter', 'Tank'],
      stats: { attackrange: 175 },
    },
    Morgana: {
      id: 'Morgana',
      key: '25',
      name: 'Morgana',
      image: { full: 'Morgana.png' },
      tags: ['Mage', 'Support'],
      stats: { attackrange: 450 },
    },
    Malphite: {
      id: 'Malphite',
      key: '54',
      name: 'Malphite',
      image: { full: 'Malphite.png' },
      tags: ['Fighter', 'Tank'],
      stats: { attackrange: 125 },
    },
    Leona: {
      id: 'Leona',
      key: '89',
      name: 'Leona',
      image: { full: 'Leona.png' },
      tags: ['Tank', 'Support'],
      stats: { attackrange: 125 },
    },
    Rammus: {
      id: 'Rammus',
      key: '33',
      name: 'Rammus',
      image: { full: 'Rammus.png' },
      tags: ['Fighter', 'Tank'],
      stats: { attackrange: 125 },
    },
    Lux: {
      id: 'Lux',
      key: '99',
      name: 'Lux',
      image: { full: 'Lux.png' },
      tags: ['Mage', 'Support'],
      stats: { attackrange: 550 },
    },
    Amumu: {
      id: 'Amumu',
      key: '32',
      name: 'Amumu',
      image: { full: 'Amumu.png' },
      tags: ['Tank', 'Mage'],
      stats: { attackrange: 125 },
    },
    Teemo: {
      id: 'Teemo',
      key: '17',
      name: 'Teemo',
      image: { full: 'Teemo.png' },
      tags: ['Marksman', 'Mage'],
      stats: { attackrange: 500 },
    },
  },
};

async function stubDdragon(page: Page) {
  await page.route('https://ddragon.leagueoflegends.com/api/versions.json', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([version]),
    });
  });

  await page.route(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(championData),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await stubDdragon(page);
});

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /LoL Draft Helper/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Clear all/i })).toBeVisible();
});

test('selects supported champion and detects enemy team tags', async ({ page }) => {
  await page.goto('/');

  const championSelect = page.getByRole('combobox');
  await championSelect.selectOption({ label: 'Volibear' });

  await expect(page.getByText(/Enemy top \(optional/i)).toBeVisible();

  const enemyTeamField = page.getByPlaceholder('Example: Diana, Zyra, Caitlyn, Darius, Thresh').first();
  await enemyTeamField.fill('Darius, Morgana');

  await expect(page.getByText(/Detected:/)).toBeVisible();
  await expect(page.getByText('1 AP')).toBeVisible();
  await expect(page.getByText(/ITEMS \(IN ORDER\)/i)).toBeVisible();
});

test('master yi detects tanky CC comp and shows master yi recommendations', async ({ page }) => {
  await page.goto('/');

  const championSelect = page.getByRole('combobox');
  await championSelect.selectOption({ label: 'Master Yi' });

  const enemyTeamField = page.getByPlaceholder('Example: Diana, Zyra, Caitlyn, Darius, Thresh').first();
  await enemyTeamField.fill('Malphite, Leona, Rammus, Lux, Amumu');

  await expect(page.getByText(/Detected:/)).toBeVisible();
  await expect(page.getByText('2+ tanks', { exact: true })).toBeVisible();
  await expect(page.getByText('burst + CC', { exact: true })).toBeVisible();
  await expect(page.getByText(/Lethal Tempo/i)).toBeVisible();
  await expect(page.getByText('FIGHT RULE:', { exact: true })).toBeVisible();
});

test('enemy chip removal updates the parsed champions', async ({ page }) => {
  await page.goto('/');

  const enemyTeamField = page.getByPlaceholder('Example: Diana, Zyra, Caitlyn, Darius, Thresh').first();
  await enemyTeamField.fill('Darius, Lux, Morgana');

  await expect(page.getByRole('button', { name: /Darius/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Lux/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Morgana/ })).toBeVisible();

  await page.getByRole('button', { name: /Darius/ }).click();

  await expect(page.getByRole('button', { name: /Darius/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Lux/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Morgana/ })).toBeVisible();
});

test('volibear top matchup shows top lane recommendations and wave guidance', async ({ page }) => {
  await page.goto('/');

  const championSelect = page.getByRole('combobox');
  await championSelect.selectOption({ label: 'Volibear' });

  const enemyTopField = page.getByRole('textbox', { name: /Enemy top/i });
  await expect(enemyTopField).toBeVisible();

  await enemyTopField.fill('Teemo');

  await expect(page.getByText('WAVE', { exact: true })).toBeVisible();
  await expect(page.getByText('LANE RULE', { exact: true })).toBeVisible();
});

test('mobile smoke test shows core inputs on small viewport', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 375, height: 812 });

  await expect(page.getByRole('heading', { name: /LoL Draft Helper/i })).toBeVisible();
  await expect(page.getByRole('combobox')).toBeVisible();
  await expect(page.getByPlaceholder('Example: Diana, Zyra, Caitlyn, Darius, Thresh').first()).toBeVisible();
});
