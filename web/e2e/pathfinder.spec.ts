import { test, expect } from '@playwright/test';

const password = 'abc123';

test.describe('Pathfinder E2E - All Roles', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`PAGE ERROR: "${msg.text()}"`);
      }
    });
  });

  test('Admin Flow - Login and Check All Tabs', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@pathfinder.com');
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.getByRole('heading', { name: 'Admin Control Panel' })).toBeVisible();

    // Check Tabs
    await page.getByRole('tab', { name: 'Agent Controls' }).click();
    await expect(page.getByLabel('Enable Opportunity Scout')).toBeVisible();

    await page.getByRole('tab', { name: 'Feature Flags' }).click();
    await expect(page.getByLabel('Enable Scholarships Module')).toBeVisible();

    await page.getByRole('tab', { name: 'Students' }).click();
    await expect(page.getByRole('heading', { name: 'All Students' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Counselor Flow - Login and Student List', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'counselor@pathfinder.com');
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: 'Counselor', exact: true }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/counselor/);
    await expect(page.getByRole('heading', { name: 'Counselor Panel' })).toBeVisible();
    await expect(page.getByText('Average GPA')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Student Flow - Login and check major pages', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@pathfinder.com');
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: 'Student', exact: true }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Student Dashboard', exact: true })).toBeVisible();

    // Navigate to Academic (Sidebar)
    await page.getByRole('link', { name: 'Academic' }).click();
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page.getByRole('heading', { name: 'Academic Roadmap' })).toBeVisible();

    // Navigate to Scholarships (Sidebar)
    await page.getByRole('link', { name: 'Scholarships' }).click();
    await expect(page).toHaveURL(/\/scholarships/);
    await expect(page.getByRole('heading', { name: 'Scholarship Matches' })).toBeVisible();

    // Navigate to LoR (Sidebar)
    await page.getByRole('link', { name: 'LoR Manager' }).click();
    await expect(page).toHaveURL(/\/lor/);
    await expect(page.getByRole('heading', { name: 'Letter of Recommendation Manager' })).toBeVisible();
  });

  test('Parent Flow - Login and Read-only Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'parent@pathfinder.com');
    await page.fill('input[name="password"]', password);
    await page.getByRole('button', { name: 'Parent', exact: true }).click();
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByRole('heading', { name: /Parent Dashboard/ })).toBeVisible();
    await expect(page.getByText('College Readiness %')).toBeVisible();
  });
});
