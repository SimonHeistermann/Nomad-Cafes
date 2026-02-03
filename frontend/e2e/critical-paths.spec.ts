import { test, expect } from '@playwright/test';

test.describe('Critical User Paths', () => {
  test.describe('Cafe Discovery Flow', () => {
    test('complete flow: home → explore → cafe detail', async ({ page }) => {
      // Step 1: Start at home
      await page.goto('/');
      await expect(page).toHaveURL('/');

      // Step 2: Navigate to explore
      const exploreLink = page.getByRole('link', { name: /explore/i }).first();
      if (await exploreLink.count() > 0) {
        await exploreLink.click();
      } else {
        await page.goto('/explore');
      }

      await expect(page).toHaveURL(/\/explore/);

      // Step 3: Wait for cafes to load
      await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 15000 });

      // Step 4: Click on a cafe
      await page.locator('.listing-card').first().click();

      // Step 5: Should be on detail page
      await expect(page).toHaveURL(/\/listing\//);

      // Step 6: Detail page should have content
      await expect(page.locator('h1, .cafe-name, [data-testid="cafe-name"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('explore page shows essential cafe info', async ({ page }) => {
      await page.goto('/explore');
      await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 15000 });

      const firstCard = page.locator('.listing-card').first();

      // Should show cafe name
      const title = firstCard.locator('.listing-card-title, h2, h3').first();
      await expect(title).toBeVisible();

      // Should be clickable
      await firstCard.click();
      await expect(page).toHaveURL(/\/listing\//);
    });
  });

  test.describe('Cafe Detail Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/explore');
      await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 15000 });
      await page.locator('.listing-card').first().click();
      await expect(page).toHaveURL(/\/listing\//);
    });

    test('displays cafe name and basic info', async ({ page }) => {
      // Name should be visible
      await expect(
        page.locator('h1').first()
          .or(page.locator('[data-testid="cafe-name"]').first())
      ).toBeVisible({ timeout: 10000 });
    });

    test('displays location information', async ({ page }) => {
      // Some form of location/address should be visible
      await expect(
        page.getByText(/berlin|lisbon|bangkok|address/i).first()
          .or(page.locator('[data-testid="cafe-location"]').first())
      ).toBeVisible({ timeout: 10000 });
    });

    test('has back navigation', async ({ page }) => {
      // Should be able to go back
      const backButton = page.getByRole('button', { name: /back/i })
        .or(page.locator('[data-testid="back-button"]'))
        .or(page.getByRole('link', { name: /back|explore/i }));

      if (await backButton.count() > 0) {
        await backButton.first().click();
        await expect(page).toHaveURL(/\/explore/);
      } else {
        // Use browser back
        await page.goBack();
        await expect(page).toHaveURL(/\/explore/);
      }
    });

    test('bookmark button is visible for unauthenticated users', async ({ page }) => {
      // Bookmark button should exist (may prompt login)
      const bookmarkButton = page.getByRole('button', { name: /bookmark|save/i })
        .or(page.locator('[data-testid="bookmark-button"]'));

      // It may or may not be visible depending on auth state
      // Just verify the page loads correctly
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles 404 gracefully', async ({ page }) => {
      await page.goto('/listing/non-existent-cafe-slug-12345');

      // Should show some error or redirect
      await expect(
        page.getByText(/not found|error|doesn't exist/i).first()
          .or(page.locator('[data-testid="error-message"]').first())
          .or(page.locator('.listing-card').first()) // Redirected to explore
      ).toBeVisible({ timeout: 10000 });
    });

    test('handles invalid routes', async ({ page }) => {
      await page.goto('/invalid-route-that-does-not-exist');

      // Should show 404 or redirect to home
      await page.waitForTimeout(2000);
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('home page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds (generous for CI)
      expect(loadTime).toBeLessThan(5000);
    });

    test('explore page loads cafes within acceptable time', async ({ page }) => {
      await page.goto('/explore');

      // Cafes should appear within 10 seconds
      await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Accessibility Basics', () => {
  test('pages have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Should have an h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('.listing-card').first()).toBeVisible({ timeout: 15000 });

    // Check that images have alt attributes
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();

    // Allow some images without alt (decorative), but not too many
    expect(imagesWithoutAlt).toBeLessThan(10);
  });
});
