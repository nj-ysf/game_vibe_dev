import { test, expect } from 'playwright/test';

test('welcome, full timed round, retry, save, rank and next-player flow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /CLOUD.*WHACK/ })).toBeVisible();
  await expect(page.getByAltText('AWS Cloud Clubs — ENSET Mohammedia')).toBeVisible();
  await expect(page.getByLabel('Phone Number')).toHaveCount(0);
  await page.getByRole('button', { name: 'PLAY NOW', exact: true }).click();
  await expect(page.getByText('READY TO MAKE IT RAIN?')).toBeVisible();
  await expect(page.locator('.cloud-target:not([disabled])')).toHaveCount(0);
  await expect(page.locator('.ready-overlay')).toHaveCount(0, { timeout: 6000 });
  const board = await page.locator('.board-stage').boundingBox();
  expect(board.y + board.height).toBeLessThanOrEqual(page.viewportSize().height);
  const deadline = Date.now() + 46000;
  while (Date.now() < deadline && await page.locator('.play-screen').count()) {
    const good = page.getByRole('button', { name: /Hit (happy|royal) cloud/ }).first();
    if (await good.count()) await good.click({ timeout: 300 }).catch(() => {});
    await page.waitForTimeout(90);
  }
  await expect(page.getByRole('heading', { name: 'Make your score official.' })).toBeVisible();
  await expect(page.locator('.cloud-target')).toHaveCount(0);
  await page.getByLabel('Full Name', { exact: true }).fill('Arcade Test Player');
  await page.getByLabel('Filière', { exact: true }).fill('TEST');
  await page.getByLabel('Phone Number', { exact: true }).fill('+212612345678');
  await page.getByRole('checkbox').check();
  await page.route('**/api/scores', route => route.abort(), { times: 1 });
  await page.getByRole('button', { name: 'SAVE MY SCORE' }).click();
  await expect(page.getByRole('alert')).toContainText('Cannot reach');
  await expect(page.getByLabel('Full Name', { exact: true })).toHaveValue('Arcade Test Player');
  await page.getByRole('button', { name: 'SAVE MY SCORE' }).click();
  await expect(page.getByText('SCORE SAVED', { exact: true })).toBeVisible();
  await expect(page.locator('.rank-reveal strong')).toContainText('#');
  await page.getByRole('button', { name: 'VIEW LEADERBOARD', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CLOUD CHAMPIONS' })).toBeVisible();
  await expect(page.locator('.rank-row').filter({ hasText: 'Arcade Test Player' })).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText('0612345678');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
  await page.screenshot({ path: `../test-results/leaderboard-${test.info().project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'PLAY AGAIN' }).click();
  await expect(page.getByText('READY TO MAKE IT RAIN?')).toBeVisible();
});
