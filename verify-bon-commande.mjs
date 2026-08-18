

import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("dialog", (d) => d.accept());
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

await page.goto("http://localhost:3000/login");
await page.fill("#email", "admin@vhumaroc.ma");
await page.fill("#password", "2dw@MawT4nX%@j@H");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 30000 });

// Product with stock to order.
await page.goto("http://localhost:3000/stock/nouveau");
await page.fill("#reference", "AUDIT-BC-PROD");
await page.fill("#name", "Audit BC Product");
await page.fill("#quantity", "10");
await page.click('button[type="submit"]');
await page.waitForURL("**/stock", { timeout: 15000 });

// Sidebar link check.
await page.goto("http://localhost:3000/dashboard");
const navLink = page.locator('a:has-text("Bons de commande")');
console.log("Sidebar nav link present:", await navLink.count());

// Create a bon de commande.
await page.goto("http://localhost:3000/bons-de-commande/nouveau");
await page.click('button:has-text("Nouveau client")');
await page.fill('input[name="newCustomerName"]', "Audit BC Client");
const productSelect = page.locator("select").nth(1);
await productSelect.selectOption({ label: "AUDIT-BC-PROD · Audit BC Product" });
await page.locator('input[type="number"]').nth(0).fill("4");
await page.click('button:has-text("Créer le bon de commande")');
await page.waitForURL(
  (url) => /\/bons-de-commande\/[a-zA-Z0-9]+$/.test(url.pathname) && !url.pathname.endsWith("/nouveau"),
  { timeout: 15000 }
);
const orderUrl = page.url();
console.log("Created order confirmation at:", orderUrl);

// Confirm stock is untouched (BC shouldn't affect stock).
await page.goto("http://localhost:3000/stock");
await page.waitForLoadState("networkidle");
let qty = await page.locator("tr", { hasText: "AUDIT-BC-PROD" }).locator("td").nth(2).textContent();
console.log("Stock quantity after BC created (expect 10, unaffected):", qty.trim());

// Check the PDF route responds with a real PDF.
const pdfResp = await page.request.get(`${orderUrl}/pdf`);
console.log("PDF route status:", pdfResp.status(), "content-type:", pdfResp.headers()["content-type"]);

// Convert to invoice.
await page.goto(orderUrl);
await page.waitForLoadState("networkidle");
await page.click('button:has-text("Convertir en facture")');
await page.waitForURL(/\/factures\/[a-zA-Z0-9]+$/, { timeout: 15000 });
console.log("Redirected to invoice:", page.url());

// Stock should now be decremented by 4.
await page.goto("http://localhost:3000/stock");
await page.waitForLoadState("networkidle");
qty = await page.locator("tr", { hasText: "AUDIT-BC-PROD" }).locator("td").nth(2).textContent();
console.log("Stock quantity after conversion (expect 6):", qty.trim());

// Revisit the order confirmation — should now show CONVERTIE + link to invoice, no action buttons.
await page.goto(orderUrl);
await page.waitForLoadState("networkidle");
const statusText = await page.locator("text=Convertie en facture").count();
console.log("Order shows 'Convertie en facture' badge:", statusText > 0);
const convertBtnGone = await page.locator('button:has-text("Convertir en facture")').count();
console.log("Convert button gone after conversion (expect 0):", convertBtnGone);
const deleteBtnGone = await page.locator('button:has-text("Supprimer")').count();
console.log("Delete button gone after conversion (expect 0):", deleteBtnGone);

await browser.close();
