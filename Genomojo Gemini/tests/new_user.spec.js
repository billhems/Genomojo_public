// @ts-check
import { test, expect } from '@playwright/test';

test.fixme('new_user flow - about you -> submit -> vote', async ({ page }) => {
    // 1. Landing Page
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    await page.goto('/');
    await page.getByRole('main').getByRole('button', { name: 'About You', exact: true }).click();

    // 2. About You Page
    await expect(page.getByRole('heading', { name: /About You/i })).toBeVisible();

    // Handle potential alerts
    page.on('dialog', dialog => dialog.accept());

    // Fill basic demographics
    await page.getByRole('combobox').first().selectOption({ index: 1 }); // Select first age
    await page.getByRole('combobox').nth(1).selectOption({ index: 1 }); // Select Male/Female/etc

    // Click "Save & Back" to complete mechanics and return to landing
    await page.getByRole('button', { name: /Save & Back/i }).click();

    // 3. Back to Landing Screen (where buttons should now be enabled)
    await expect(page.getByRole('heading', { name: /The Human Mojo Project/i })).toBeVisible();

    // Click "Add a MoHi"
    await page.getByRole('button', { name: /Add a MoHi/i }).click();

    // 4. Submit Screen
    await expect(page.getByRole('heading', { name: /Add a MoHi/i })).toBeVisible();

    const testFactor = `Test Factor ${Date.now()}`;
    await page.getByPlaceholder(/e.g./).fill(testFactor);

    // Click Submit
    await page.getByRole('button', { name: /Submit Factor/i }).click();

    // 5. Success Modal
    await expect(page.getByText(/Submission Successful/i)).toBeVisible();
    await page.getByRole('button', { name: /Done/i }).click();

    // 6. Back to Landing
    await expect(page.getByRole('heading', { name: /The Human Mojo Project/i })).toBeVisible();

    // 7. Go to Vote
    await page.getByRole('button', { name: /Vote on Submissions/i }).click();
    await expect(page.getByRole('heading', { name: /Vote/i })).toBeVisible();

    // 8. Verify items load (wait for card)
    // Look for "Skip" or star rating buttons
    await expect(page.getByRole('button', { name: /Skip/i })).toBeVisible();
});
