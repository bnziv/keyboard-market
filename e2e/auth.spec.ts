import { test, expect } from '@playwright/test';

const timestamp = Date.now();
const TEST_EMAIL = `e2e_${timestamp}@test.com`;
const TEST_USERNAME = `e2euser${timestamp}`;
const TEST_PASSWORD = 'E2ePass123!';

test.describe('Auth flow', () => {
  test('user can register, see their username in the nav, and log out', async ({ page }) => {
    await page.goto('/');

    // Navigate to register/login page
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Switch to register tab if present, or fill registration fields
    const registerTab = page.getByRole('tab', { name: /register/i });
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/username/i).fill(TEST_USERNAME);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /register/i }).click();

    // After registration, the user should be redirected and see their username in the nav
    await expect(page.locator('header')).toContainText(
      TEST_USERNAME[0].toUpperCase(),
      { timeout: 8000 },
    );

    // Log out via the nav dropdown
    const userAvatar = page.locator('header button').filter({
      hasText: TEST_USERNAME[0].toUpperCase(),
    });
    await userAvatar.click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    // After logout, the Login button should reappear
    await expect(
      page.getByRole('button', { name: /login/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('user can log in with credentials', async ({ page }) => {
    // First register via API to seed the user
    const res = await page.request.post('/api/auth/register', {
      data: { email: `login_${timestamp}@test.com`, username: `login${timestamp}`, password: TEST_PASSWORD },
    });
    expect([201, 409]).toContain(res.status()); // 201 = created, 409 = already exists (on re-run)

    await page.goto('/login');
    await page.getByLabel(/email or username/i).fill(`login_${timestamp}@test.com`);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^login$/i }).click();

    await expect(page.locator('header')).toContainText(
      'L', // first letter of "login${timestamp}"
      { timeout: 8000 },
    );
  });

  test('shows an error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email or username/i).fill('nobody@nowhere.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /^login$/i }).click();

    await expect(
      page.getByText(/invalid credentials|incorrect|error/i),
    ).toBeVisible({ timeout: 5000 });
  });
});
