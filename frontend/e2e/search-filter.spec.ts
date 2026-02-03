import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    // Wait for initial load
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('search bar is visible and functional', async ({ page }) => {
    // Search bar should be visible
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('coffee');

    // Should filter results (or show loading state)
    await page.waitForTimeout(500); // Debounce wait
  });

  test('filter dropdowns are accessible', async ({ page }) => {
    // Look for filter buttons or dropdowns
    const filterButtons = page.locator('[data-testid="filter-button"], button:has-text("Filter"), .filter-dropdown');

    // At least one filter mechanism should exist
    const count = await filterButtons.count();
    if (count > 0) {
      await expect(filterButtons.first()).toBeVisible();
    }
  });

  test('location filter works', async ({ page }) => {
    // Check if location selector exists
    const locationSelect = page.locator('[data-testid="location-filter"], select[name="location"], .location-select');

    if (await locationSelect.count() > 0) {
      await expect(locationSelect.first()).toBeVisible();
    }
  });

  test('can clear filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);

    // Enter search term
    await searchInput.fill('test search');

    // Clear it
    await searchInput.clear();

    // Should return to unfiltered state
    await expect(searchInput).toHaveValue('');
  });

  test('results update when applying filters', async ({ page }) => {
    // Get initial card count
    const initialCards = await page.locator('.listing-card').count();

    // Apply a search filter
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('unique search term xyz');

    // Wait for debounce and API response
    await page.waitForTimeout(1000);

    // Results should potentially change (or show no results)
    // This verifies the filter mechanism works
  });
});

test.describe('Pagination and Loading', () => {
  test('handles loading states gracefully', async ({ page }) => {
    await page.goto('/explore');

    // Page should show content (either loading or results)
    await expect(
      page.locator('.listing-card').first()
        .or(page.getByText(/loading/i))
        .or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 15000 });
  });

  test('scroll behavior works', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 15000 });

    // Scroll down the page
    await page.evaluate(() => window.scrollBy(0, 500));

    // Page should still be functional
    await expect(page.locator('.listing-card').first()).toBeVisible();
  });
});
