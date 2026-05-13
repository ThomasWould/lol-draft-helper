// tests/lol-draft-helper.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads and shows the main draft helper UI', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/LoL Draft Helper/i)).toBeVisible();
});