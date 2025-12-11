// @ts-check
import { test, expect } from '@playwright/test';

test('smoke test - site loads and shows title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Genomojo/);

    // Expect the main heading to be visible
    await expect(page.getByRole('heading', { level: 1, name: 'The Human Mojo Project' })).toBeVisible();

    // Check for the "About You" button (Main CTA)
    await expect(page.getByRole('main').getByRole('button', { name: 'About You', exact: true })).toBeVisible();
});
