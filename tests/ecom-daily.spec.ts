import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { LoginPage } from '../pages/LoginPage';
import path from 'path';
import dotenv from 'dotenv';

// ✅ This ensures the .env file is found relative to this script
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// --------------------
// Test data
// --------------------
const EXPECTED_ISBNS = [
  '9780170346641',
  '9780170486781',
  '9780170335201',
];

const SEARCH_QUERY = EXPECTED_ISBNS.join(',');

// --------------------
// Helpers
// --------------------
// Replace your local getCredentials with a more robust one or import the one from env.ts
function getCredentials(projectName: string) {
  const prefix = projectName.toUpperCase(); 
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !password) {
    throw new Error(`CRITICAL: Could not find .env variables for ${prefix}_EMAIL. check if .env is loaded.`);
  }

  return { email, password };
}

// ======================================================
// Homepage & Login
// ======================================================
test.describe('Homepage, Search and Login Test', () => {
  let loginPage: LoginPage;
  let email: string;
  let password: string;

  test.beforeEach(async ({ page }, testInfo) => {
    const creds = getCredentials(testInfo.project.name);

    email = creds.email;
    password = creds.password;

    loginPage = new LoginPage(page);
    await loginPage.goto(); // ✅ baseURL
  });

  test('can load homepage and validate title', async ({ page }) => {
    await expect(page).toHaveTitle(
      /Cengage \| Publisher.*Australia and New Zealand/
    );
  });

  test('can accept cookie consent modal', async () => {
    await loginPage.acceptCookies();
  });

  test('can login successfully', async () => {
    await loginPage.acceptCookies();
    await loginPage.clickLogin();
    await loginPage.login(email, password);
    await loginPage.assertLoginSuccess();
  });

  test('NZ can search isbn from landing page and verify all results', async ({ page }) => {
    // 🔹 Explicit cross-region test (intentional)
    await page.goto('https://cengage.co.nz/');

    await page.getByLabel('Search').fill(SEARCH_QUERY);
    await page.getByLabel('Search').press('Enter');

    await page.waitForURL('**/qry/9780170346641*');

    const resultsContainer = page.locator('#ProductResultDiv');

    for (const isbn of EXPECTED_ISBNS) {
      await expect(resultsContainer).toContainText(isbn, {
        timeout: 10_000,
      });
    }
  });

  test('AU can search isbn from landing page and verify all results', async ({ page }) => {
    // 🔹 Explicit cross-region test (intentional)
    await page.goto('https://cengage.com.au/');

    await page.getByLabel('Search').fill(SEARCH_QUERY);
    await page.getByLabel('Search').press('Enter');

    await page.waitForURL('**/qry/9780170346641*');

    const resultsContainer = page.locator('#ProductResultDiv');

    for (const isbn of EXPECTED_ISBNS) {
      await expect(resultsContainer).toContainText(isbn, {
        timeout: 10_000,
      });
    }
  });
});

// ======================================================
// Cart Tests
// ======================================================
test.describe('Cart and Checkout Tests', () => {
  let creds: { email: string; password: string };

  test.beforeEach(async ({}, testInfo) => {
    creds = getCredentials(testInfo.project.name);
  });

  test('can add to cart and verify total', async ({ page }) => {
    const cart = new CartPage(page);

    await cart.goto(); // ✅ baseURL
    await cart.openPrimaryCategory();
    await cart.triggerSearch();
    await cart.addFirstItems();
    await cart.goToCart();
    await cart.verifyTotal();
  });

  test('can checkout via B2B Pay on Account', async ({ page }) => {
    const login = new LoginPage(page);
    const cart = new CartPage(page);

    // login
    await login.goto();
    await login.acceptCookies();
    await login.clickLogin();
    await login.login(creds.email, creds.password);
    await login.assertLoginSuccess();

    // cart
    await cart.goto();
    await cart.openPrimaryCategory();
    await cart.triggerSearch();
    await cart.addFirstItems();
    await cart.goToCart();

    // checkout
    await expect(
      page.locator('#dnn_ctr1322_View_ctl00_btnCheckout')
    ).toBeVisible();

    await page.locator('#dnn_ctr1322_View_ctl00_btnCheckout').click({ timeout: 15_000 });

    await expect(page).toHaveURL(/\/checkout$/i, { timeout: 20_000 });

    
    // Ensure the checkbox is actually ready in the DOM
    const agreementCheckbox = page.locator('#chkIagree');
    await agreementCheckbox.waitFor({ state: 'visible', timeout: 10_000 });

    // Click it
    await agreementCheckbox.click({ force: true });
    await expect(page.locator('#btnPayOnInvoice')).toBeVisible();

    await page.getByRole('button', { name: 'Pay on Invoice' }).click({ force: true });

        
    await page.waitForURL(/\/Checkout\?value=success$/i, { timeout: 15_000 });

    await expect(page.locator('#OrderNumber')).toBeVisible({ timeout: 20_000 });


  });

  test('can checkout via B2B Credit Card', async ({ page }) => {
    // intentionally left blank for future implementation
  });
});
