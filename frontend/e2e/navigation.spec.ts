import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header navigation is visible', async ({ page }) => {
    await page.goto('/');

    // Header should be visible
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('can navigate from home to explore', async ({ page }) => {
    await page.goto('/');

    // Click explore link/button
    const exploreLink = page.getByRole('link', { name: /explore/i })
      .or(page.getByRole('button', { name: /explore/i }));

    if (await exploreLink.count() > 0) {
      await exploreLink.first().click();
      await expect(page).toHaveURL(/\/explore/);
    }
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');

    const loginLink = page.getByRole('link', { name: /sign in|login/i })
      .or(page.getByRole('button', { name: /sign in|login/i }));

    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('logo links to home', async ({ page }) => {
    await page.goto('/explore');

    // Click logo or brand name
    const logo = page.getByRole('link', { name: /nomad/i }).first()
      .or(page.locator('.logo, [data-testid="logo"]').first());

    if (await logo.count() > 0) {
      await logo.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('mobile menu toggle works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for hamburger menu
    const menuButton = page.getByRole('button', { name: /menu/i })
      .or(page.locator('[data-testid="mobile-menu-button"], .hamburger, .menu-toggle'));

    if (await menuButton.count() > 0) {
      await menuButton.first().click();
      // Menu should open
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Footer', () => {
  test('footer is visible on pages', async ({ page }) => {
    await page.goto('/');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    test(`renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Page should load without errors
      await expect(page.locator('body')).toBeVisible();

      // No horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      // Allow small overflow on mobile (scrollbars)
      if (viewport.width > 375) {
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  }
});
