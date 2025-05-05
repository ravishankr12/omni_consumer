// pages/inventoryPage.ts

import { Page } from '@playwright/test';

export class InventoryPage {
  constructor(private page: Page) {}

  async getProductNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
  }
}
