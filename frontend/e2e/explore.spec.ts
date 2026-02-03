import { test, expect } from '@playwright/test';

test.describe('Explore Page', () => {
  test('displays cafe listings', async ({ page }) => {
    await page.goto('/explore');

    // Wait for listings to load
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 10000 });

    // Should have multiple cafe cards
    const cards = page.locator('.listing-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/explore');

    // Wait for listings to load - this confirms the page works
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 10000 });

    // URL should be correct
    await expect(page).toHaveURL(/\/explore/);
  });

  test('can navigate to cafe detail page', async ({ page }) => {
    await page.goto('/explore');

    // Wait for listings
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 10000 });

    // Click on first cafe card
    await page.locator('.listing-card').first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/listing\//);
  });

  test('displays cafe information on cards', async ({ page }) => {
    await page.goto('/explore');

    // Wait for listings
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('.listing-card').first();

    // Cards should have title
    await expect(firstCard.locator('.listing-card-title')).toBeVisible();

    // Cards should have footer with category
    await expect(firstCard.locator('.listing-card-footer')).toBeVisible();
  });
});
