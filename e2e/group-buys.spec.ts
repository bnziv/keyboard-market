import { test, expect } from '@playwright/test';

test.describe('Group Buys public flow', () => {
  test('can browse group buys page and see heading', async ({ page }) => {
    await page.goto('/group-buys');

    await expect(page).toHaveURL(/\/group-buys/);
    await expect(page.getByRole('heading', { name: /group buys/i })).toBeVisible();
  });

  test('Group Buys link is visible in the nav', async ({ page }) => {
    await page.goto('/');
    const navLink = page.getByRole('link', { name: 'Group Buys' }).first();
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/group-buys/);
  });
});

test.describe('Listings public flow', () => {
  test('Browse link navigates to listings page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse' }).first().click();
    await expect(page).toHaveURL(/\/listings/);
  });

  test('listings page renders content area', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.locator('section').first()).toBeVisible();
  });
});

test.describe('Protected route redirect', () => {
  test('visiting /create-listing while unauthenticated redirects to home', async ({ page }) => {
    await page.goto('/create-listing');
    await expect(page).not.toHaveURL(/\/create-listing/, { timeout: 3000 });
  });
});
