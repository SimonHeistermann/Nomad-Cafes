import { test, expect } from '@playwright/test';

test.describe('Cafe Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to explore and click first cafe to get to a detail page
    await page.goto('/explore');
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 10000 });
    await page.locator('.listing-card').first().click();
    await expect(page).toHaveURL(/\/listing\//);
  });

  test('displays cafe header information', async ({ page }) => {
    // Cafe name should be visible
    await expect(page.locator('.listing-detail-title').or(page.locator('h1'))).toBeVisible();

    // Location info
    await expect(page.locator('.listing-detail-meta-item').first()).toBeVisible();
  });

  test('displays cafe description', async ({ page }) => {
    await expect(
      page.locator('.listing-section').first().or(page.locator('.listing-description'))
    ).toBeVisible();
  });

  test('displays reviews section', async ({ page }) => {
    // Reviews section should exist
    await expect(page.locator('#listing-detail-reviews')).toBeVisible();
  });

  test('has add review section', async ({ page }) => {
    await expect(
      page.locator('#listing-detail-add-review').or(page.locator('.listing-add-review-section'))
    ).toBeVisible();
  });

  test('shows auth prompt when clicking save without login', async ({ page }) => {
    // Find and click the save/favorite button
    const saveButton = page.locator('.listing-detail-header-btn').filter({ hasText: /save/i });

    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show auth modal
      await expect(page.locator('.auth-cta-modal')).toBeVisible({ timeout: 5000 });
    }
  });

  test('displays opening hours', async ({ page }) => {
    await expect(
      page.getByText(/open/i).first()
    ).toBeVisible();
  });
});
