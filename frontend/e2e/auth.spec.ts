import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('shows validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show validation errors
      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should show error message (wait for API response)
      await expect(
        page.getByText(/failed/i).or(page.getByText(/invalid/i)).or(page.getByText(/error/i))
      ).toBeVisible({ timeout: 10000 });
    });

    test('has link to register page', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('displays registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i).or(page.locator('input[type="password"]').first())).toBeVisible();
    });

    test('shows validation errors for empty form', async ({ page }) => {
      await page.goto('/register');

      await page.getByRole('button', { name: /create account/i }).click();

      // Should show validation errors - just check one exists
      await expect(page.getByText(/is required/i).first()).toBeVisible();
    });

    test('validates password strength', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');

      // Fill password that's too weak (less than 8 chars)
      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.fill('weak');

      // Submit to trigger validation
      await page.getByRole('button', { name: /create account/i }).click();

      // Should show password validation error (at least 8 characters)
      await expect(page.getByText(/8 character/i)).toBeVisible({ timeout: 5000 });
    });

    test('has link to login page', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });
  });
});
