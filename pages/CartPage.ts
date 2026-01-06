import { Page, Locator, expect } from "@playwright/test";

export class CartPage {
  readonly page: Page;

  readonly primaryMenu: Locator;
  readonly searchButton: Locator;
  readonly addToCartButtons: Locator;
  readonly cartLink: Locator;
  readonly lineTotals: Locator;
  readonly shippingLabel: Locator;
  readonly cartTotalFooter: Locator;
  readonly clearCartBtn: Locator;
  readonly confirmClearBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.primaryMenu = page.locator("#dnn_CENGAGESUBMENU_PrimaryLink");
    this.searchButton = page.locator("#nondiv-searchbtn");
    this.addToCartButtons = page.locator('button[id^="AddToCartBtn"]');
    this.cartLink = page.locator("#cartlnk");

    this.lineTotals = page.locator(".PriceComputed.line-total");
    this.shippingLabel = page.locator("#ShippingCostLabel");
    this.cartTotalFooter = page.locator("#CartTotalLabelFooter");

    this.clearCartBtn = page.locator("#linkDelete").first();
    this.confirmClearBtn = page.locator("#btnClearCartConfirm");
  }

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async openPrimaryCategory() {
    await this.primaryMenu.click();
  }

  async triggerSearch() {
    await this.searchButton.click();
    await expect(this.addToCartButtons.first()).toBeVisible({ timeout: 15000 });
  }

  async addFirstItems() {
    const btn = this.addToCartButtons.first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ noWaitAfter: true });

    // wait for cart state to update
    await expect(this.page.locator("#cartlnk")).toContainText(/\d+/, {
      timeout: 15000,
    });
  }

  async goToCart() {
    await this.cartLink.click();
    await this.page.waitForURL(/\/list\/item\/cart/, { timeout: 15000 });
  }

  async verifyTotal() {
    await expect(this.cartTotalFooter).toBeVisible();

    const prices = await this.lineTotals.allInnerTexts();
    const subtotal = prices.reduce(
      (sum, p) => sum + Number(p.replace(/[^0-9.]/g, "")),
      0,
    );

    const shipping =
      subtotal >= 200
        ? 0
        : Number(
            (await this.shippingLabel.innerText()).replace(/[^0-9.]/g, ""),
          );

    const displayed = Number(
      (await this.cartTotalFooter.innerText()).replace(/[^0-9.]/g, ""),
    );

    expect(displayed).toBeCloseTo(subtotal + shipping, 2);
  }

  async clearCart() {
    await this.cartLink.click();
    await this.clearCartBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.clearCartBtn.click();
    await this.confirmClearBtn.click();
  }
}
