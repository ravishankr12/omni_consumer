import { Page, Locator } from '@playwright/test';

export class CheckoutCompletePage {
  private page: Page;

  // --- Web Elements ---
  readonly thankYouMessage: Locator;
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly ponyExpressImage: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.thankYouMessage = page.locator('.complete-header');
    this.completeHeader = page.locator('.complete-header');
    this.completeText = page.locator('.complete-text');
    this.ponyExpressImage = page.locator('.pony_express');
    this.backHomeButton = page.locator('#back-to-products');
  }

  // --- Page Methods ---

  /**
   * Verify if the thank you message is visible.
   */
  async isThankYouMessageVisible(): Promise<boolean> {
    return await this.thankYouMessage.isVisible();
  }

  /**
   * Get the completion message text.
   */
  async getCompleteText(): Promise<string> {
    return (await this.completeText.textContent())?.trim() ?? '';
  }

  /**
   * Click on "Back Home" button.
   */
  async clickBackHome(): Promise<void> {
    await this.backHomeButton.click();
  }

  /**
   * Verify that pony express image is shown.
   */
  async isPonyExpressVisible(): Promise<boolean> {
    return await this.ponyExpressImage.isVisible();
  }
}
