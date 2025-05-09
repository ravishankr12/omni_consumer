import { Page, Locator } from '@playwright/test';

export class CartPage {
  private page: Page;

  // --- Web Elements ---
  readonly cartItems: Locator;
  readonly cartItemNames: Locator;
  readonly cartItemPrices: Locator;
  readonly removeButtons: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.cartItemNames = page.locator('.inventory_item_name');
    this.cartItemPrices = page.locator('.inventory_item_price');
    this.removeButtons = page.locator('.cart_button');
    this.continueShoppingButton = page.locator('#continue-shopping');
    this.checkoutButton = page.locator('#checkout');
  }

  // --- Page Methods ---

  /**
   * Get number of items currently in the cart.
   */
  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  /**
   * Get all product names currently in the cart.
   */
  async getCartItemNames(): Promise<string[]> {
    return this.cartItemNames.allTextContents();
  }

  /**
   * Remove a product from cart by its index (0-based).
   * @param index - index of item to remove
   */
  async removeItemByIndex(index: number): Promise<void> {
    await this.removeButtons.nth(index).click();
  }

  /**
   * Remove a product from cart by product name.
   * @param productName - exact product title
   */
  async removeItemByName(productName: string): Promise<void> {
    const item = this.page.locator(`.cart_item:has(.inventory_item_name:text("${productName}"))`);
    await item.locator('.cart_button').click();
  }

  /**
   * Click the "Continue Shopping" button.
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  /**
   * Click the "Checkout" button to proceed.
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
