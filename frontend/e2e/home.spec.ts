import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('displays hero section', async ({ page }) => {
    await page.goto('/');

    // Hero section should be visible
    await expect(page.locator('.hero')).toBeVisible();

    // Main CTA button should exist
    await expect(page.getByRole('link', { name: /explore/i }).first()).toBeVisible();
  });

  test('displays navigation header', async ({ page }) => {
    await page.goto('/');

    // Logo should be visible
    await expect(page.locator('.header-logo')).toBeVisible();

    // Nav links should exist - use text content instead of role
    await expect(page.locator('.header-nav-link').filter({ hasText: /home/i })).toBeVisible();
    await expect(page.locator('.header-nav-link').filter({ hasText: /explore/i })).toBeVisible();
  });

  test('displays login/signup buttons when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Header buttons - match exact text from translations
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('displays stats section', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.stats-section')).toBeVisible();
  });

  test('navigates to explore page', async ({ page }) => {
    await page.goto('/');

    // Click on explore in navigation
    await page.locator('.header-nav-link').filter({ hasText: /explore/i }).click();

    await expect(page).toHaveURL(/\/explore/);
  });
});
