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
  readonly checkoutBtn: Locator;

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
    this.checkoutBtn = page.locator('button[id$="btnCheckout"], a[id$="btnCheckout"]');
  }

  async goto(path: string = "/") {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
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

    await expect(this.cartLink).toContainText(/\d+/, { timeout: 15000 });
  }

  async goToCart() {
    await expect(this.cartLink).toBeVisible({ timeout: 15_000 });
    await this.cartLink.click({ force: true });

    await expect
        .poll(() => this.page.url(), { timeout: 20_000 })
        .toContain('/cart');
  }

  async verifyTotal() {
    await expect(this.cartTotalFooter).toBeVisible();

    
  // ✅ CRITICAL WAIT
    await expect(this.lineTotals.first()).toBeVisible({ timeout: 20_000 });

    const prices = await this.lineTotals.allInnerTexts();
    const subtotal = prices.reduce(
      (sum, p) => sum + Number(p.replace(/[^0-9.]/g, "")),
      0
    );

    const shipping =
      subtotal >= 200
        ? 0
        : Number(
            (await this.shippingLabel.innerText()).replace(/[^0-9.]/g, "")
          );

    const displayed = Number(
      (await this.cartTotalFooter.innerText()).replace(/[^0-9.]/g, "")
    );

    expect(displayed).toBeCloseTo(subtotal + shipping, 2);
  }

  async proceedToCheckout() {
    // Wait for the button to be stable and attached
    await this.checkoutBtn.scrollIntoViewIfNeeded();
    await expect(this.checkoutBtn).toBeEnabled({ timeout: 15_000 });
    await this.checkoutBtn.click();
}



  async clearCart() {
    await this.cartLink.click();
    await this.clearCartBtn.waitFor({ state: "visible", timeout: 10_000 });
    await this.clearCartBtn.click();
    await this.confirmClearBtn.click();
  }
}
