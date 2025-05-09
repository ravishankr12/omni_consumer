import { Page, Locator } from '@playwright/test';

export class CheckoutStepTwoPage {
  private page: Page;

  // --- Web Elements ---
  readonly summaryContainer: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;
  readonly cartItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.summaryContainer = page.locator('.summary_info');
    this.itemTotal = page.locator('.summary_subtotal_label');
    this.tax = page.locator('.summary_tax_label');
    this.total = page.locator('.summary_total_label');
    this.finishButton = page.locator('#finish');
    this.cancelButton = page.locator('#cancel');
    this.cartItems = page.locator('.cart_item');
  }

  // --- Page Methods ---

  /**
   * Get item total from summary.
   */
  async getItemTotal(): Promise<string> {
    return (await this.itemTotal.textContent())?.trim() ?? '';
  }

  /**
   * Get tax amount from summary.
   */
  async getTax(): Promise<string> {
    return (await this.tax.textContent())?.trim() ?? '';
  }

  /**
   * Get total amount from summary.
   */
  async getTotal(): Promise<string> {
    return (await this.total.textContent())?.trim() ?? '';
  }

  /**
   * Finish the checkout process.
   */
  async clickFinish(): Promise<void> {
    await this.finishButton.click();
  }

  /**
   * Cancel checkout and go back to inventory or cart.
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Get number of items listed on the final review page.
   */
  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }
}
