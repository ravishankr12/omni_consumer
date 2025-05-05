import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import { LoginPage } from '../pages/loginPage';
import { InventoryPage } from '../pages/inventoryPage';

dotenv.config(); // Load .env

let loginPage: LoginPage;
let inventoryPage: InventoryPage;

test.describe('SauceDemo Test with Hooks and POM + .env', () => {
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);

    const baseUrl = process.env.BASE_URL || 'https://www.saucedemo.com/v1';
    const username = process.env.USERNAME!;
    const password = process.env.PASSWORD!;

    await page.goto(baseUrl);
    await loginPage.login(username, password);
    const success = await loginPage.isLoginSuccessful();
    console.log('🔐 Login Success:', success);
    expect(success).toBeTruthy();
  });

  test('Print product names from inventory', async ({}) => {
    const products = await inventoryPage.getProductNames();
    console.log('🛒 Products available:');
    products.forEach((name) => console.log('→', name));
    expect(products.length).toBeGreaterThan(0);
  });
});
