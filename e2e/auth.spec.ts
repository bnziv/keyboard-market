import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const TEST_EMAIL = `e2e_${timestamp}@test.com`;
const TEST_USERNAME = `e2euser${timestamp}`;
const TEST_PASSWORD = 'E2ePass123!';

test.describe('Auth flow', () => {
  test('user can register, see their username in the nav, and log out', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Switch to sign-up mode
    await page.getByRole('button', { name: 'Create account' }).click();

    // Step 1: fill credentials
    await page.getByPlaceholder('yourname').fill(TEST_USERNAME);
    await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);

    // Terms checkbox: onClick is on the small square div, sibling of the label span
    await page.locator('div:has(> span:has-text("I agree"))').locator('div').first().click();

    await page.getByRole('button', { name: /continue/i }).click();

    // Step 2: interests (optional) — just finish
    await page.getByRole('button', { name: /finish/i }).click();

    // Username initial should appear in the nav
    await expect(page.locator('header')).toContainText(
      TEST_USERNAME[0].toUpperCase(),
      { timeout: 10000 },
    );

    // Log out via nav dropdown
    const userAvatar = page.locator('header button').filter({
      hasText: TEST_USERNAME[0].toUpperCase(),
    });
    await userAvatar.click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await expect(
      page.getByRole('button', { name: /login/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('user can log in with credentials', async ({ page }) => {
    const res = await page.request.post('/api/auth/register', {
      data: {
        email: `login_${timestamp}@test.com`,
        username: `login${timestamp}`,
        password: TEST_PASSWORD,
      },
    });
    expect([201, 409]).toContain(res.status());

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(`login_${timestamp}@test.com`);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('header')).toContainText(
      'L',
      { timeout: 8000 },
    );
  });

  test('shows an error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('nobody@nowhere.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText(/invalid|incorrect|error|failed/i),
    ).toBeVisible({ timeout: 5000 });
  });
});
