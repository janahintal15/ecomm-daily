import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { LoginPage } from '../pages/LoginPage';
import dotenv from 'dotenv';

dotenv.config();

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
function getCredentials(projectName: string) {
  const prefix = projectName.toUpperCase(); // S2 / PROD
  return {
    email: process.env[`${prefix}_EMAIL`]!,
    password: process.env[`${prefix}_PASSWORD`]!,
    baseUrl: process.env[`${prefix}_BASE_URL`]!,
  };
}

// ======================================================
// Homepage & Login
// ======================================================
test.describe('Homepage, Search and Login Test', () => {
  let loginPage: LoginPage;
  let baseUrl: string;
  let email: string;
  let password: string;

  test.beforeEach(async ({ page }, testInfo) => {
    const creds = getCredentials(testInfo.project.name);

    email = creds.email;
    password = creds.password;
    baseUrl = creds.baseUrl;

    loginPage = new LoginPage(page);
    await loginPage.goto(baseUrl);
  });

  test('can load homepage and validate title', async ({ page }) => {
    await expect(page).toHaveTitle(
      /Cengage \| Publisher.*Australia and New Zealand/
    );
  });

  test('can accept cookie consent modal', async () => {
    await loginPage.acceptCookies();
  });

  test('can login successfully', async ({ page }) => {
    await loginPage.acceptCookies();
    await page.getByText('Log in').click();
    await loginPage.login(email, password);
    await loginPage.assertLoginSuccess();
  });

  test('NZ can search isbn from landing page and verify all results', async ({ page }) => {
    await page.goto('https://cengage.co.nz/');
    await page.getByLabel('Search').fill(SEARCH_QUERY);
    await page.getByLabel('Search').press('Enter');

    await page.waitForURL('**/qry/9780170346641*');

    const resultsContainer = page.locator('#ProductResultDiv');

    for (const isbn of EXPECTED_ISBNS) {
      await expect(resultsContainer).toContainText(isbn, {
        timeout: 10000,
      });
    }
  });

  test('AU can search isbn from landing page and verify all results', async ({ page }) => {
    await page.goto('https://cengage.com.au/');
    await page.getByLabel('Search').fill(SEARCH_QUERY);
    await page.getByLabel('Search').press('Enter');

    await page.waitForURL('**/qry/9780170346641*');

    const resultsContainer = page.locator('#ProductResultDiv');

    for (const isbn of EXPECTED_ISBNS) {
      await expect(resultsContainer).toContainText(isbn, {
        timeout: 10000,
      });
    }
  });
});

// ======================================================
// Cart Tests
// ======================================================
test.describe('Cart and Checkout Tests', () => {
  let baseUrl: string;
  let creds: { email: string; password: string; baseUrl: string };

  test.beforeEach(async ({}, testInfo) => {
    creds = getCredentials(testInfo.project.name);
    baseUrl = creds.baseUrl;
  });

  test('can add to cart and verify total', async ({ page }) => {
    const cart = new CartPage(page);

    await cart.goto(baseUrl);
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
    await login.goto(baseUrl);
    await login.acceptCookies();
    await login.clickLogin();
    await login.login(creds.email, creds.password);
    await login.assertLoginSuccess();

    // cart
    await cart.goto(baseUrl);
    await cart.openPrimaryCategory();
    await cart.triggerSearch();
    await cart.addFirstItems();
    await cart.goToCart();

    // checkout
    await expect(
      page.locator('#dnn_ctr1322_View_ctl00_btnCheckout')
    ).toBeVisible();
    await page.locator('#dnn_ctr1322_View_ctl00_btnCheckout').click();

    await expect(page).toHaveURL(/\/checkout$/i, { timeout: 20000 });

    await page.locator('#chkIagree').click();
    await expect(page.locator('#btnPayOnInvoice')).toBeVisible();

    await page.getByRole('button', { name: 'Pay on Invoice' }).click();

    await expect(page).toHaveURL(/\/Checkout\?value=success$/i);
    await expect(page.locator('#OrderNumber')).toBeVisible();
  });

  test('can checkout via B2B Credit Card', async ({ page }) => {
    // intentionally left blank for future implementation
  });
});
