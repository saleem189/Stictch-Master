import { expect, test } from '@playwright/test';

test('public storefront renders and links to bespoke quote flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /a fit that feels like you/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /request a bespoke quote/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /made personal, at every step/i })).toBeVisible();
});

test('tracking lookup uses the emulator and reports a missing code', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Order tracking code').fill('missing-e2e-order');
  await page.getByRole('button', { name: /track order/i }).click();

  await expect(page.getByText(/tracking record not found/i)).toBeVisible();
});

test('admin route sends signed-out visitors to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /admin portal/i })).toBeVisible();
});
