// @ts-check
import { test, expect } from '@playwright/test';

test('admin access control', async ({ page }) => {
    // 1. Visit Admin route (triggers redirection to admin_login state)
    await page.goto('/admin');

    // 2. Verify Login Page Elements
    // 2. Verify Login Page Elements
    await expect(page.getByPlaceholder('admin@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Log In/i })).toBeVisible();
});

