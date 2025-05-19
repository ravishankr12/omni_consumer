import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  private page: Page;

  // --- Web Elements ---
  readonly inventoryContainer: Locator;
  readonly inventoryItems: Locator;
  readonly addToCartButtons: Locator;
  readonly cartBadge: Locator;
  readonly sortDropdown: Locator;
  readonly productTitles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryContainer = page.locator('.inventory_list');
    this.inventoryItems = page.locator('.inventory_item');
    this.addToCartButtons = page.locator('button.btn_inventory');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.sortDropdown = page.locator('.product_sort_container');
    this.productTitles = page.locator('.inventory_item_name');
  }

  // --- Page Methods ---

  /**
   * Get number of visible inventory items.
   */
  async getInventoryItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  /**
   * Click 'Add to Cart' button for the item at the given index.
   * @param index - item index (0-based)
   */
  async addItemToCartByIndex(index: number): Promise<void> {
    await this.addToCartButtons.nth(index).click();
  }

  /**
   * Get current count of items in cart (visible in cart badge).
   */
  async getCartCount(): Promise<number> {
    const text = await this.cartBadge.textContent();
    return text ? parseInt(text) : 0;
  }

  /**
   * Select a sort option (e.g., "Name (A to Z)", "Price (low to high)")
   * @param optionValue - value attribute of option (e.g., 'az', 'lohi')
   */
  async selectSortOption(optionValue: string): Promise<void> {
    await this.sortDropdown.selectOption(optionValue);
  }

  /**
   * Get list of all product titles.
   */
  async getAllProductTitles(): Promise<string[]> {
    return this.productTitles.allTextContents();
  }

  /**
   * Verify if an item with given title exists.
   */
  async isProductVisible(productName: string): Promise<boolean> {
    return this.page.locator(`.inventory_item_name:text("${productName}")`).isVisible();
  }
}
