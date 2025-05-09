import { Page, Locator } from '@playwright/test';

export class CheckoutStepOnePage {
  private page: Page;

  // --- Web Elements ---
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('#first-name');
    this.lastNameInput = page.locator('#last-name');
    this.postalCodeInput = page.locator('#postal-code');
    this.continueButton = page.locator('#continue');
    this.cancelButton = page.locator('#cancel');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  // --- Page Methods ---

  /**
   * Fill checkout form and continue.
   * @param firstName - First Name
   * @param lastName - Last Name
   * @param postalCode - Postal Code
   */
  async fillCheckoutForm(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  /**
   * Submit empty form to trigger validation.
   */
  async submitEmptyForm(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Get error message after invalid submission.
   */
  async getErrorMessage(): Promise<string> {
    const message = await this.errorMessage.textContent();
    return message ?? '';
  }

  /**
   * Click cancel and return to the cart.
   */
  async cancelCheckout(): Promise<void> {
    await this.cancelButton.click();
  }
}
