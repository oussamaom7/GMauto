
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000/login");
await page.fill("#email", "admin@vhumaroc.ma");
await page.fill("#password", "2dw@MawT4nX%@j@H");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 30000 });

// Create a product with a distinct reference to select on the BC form.
await page.goto("http://localhost:3000/stock/nouveau");
await page.fill("#reference", "AUDIT-ITEMREF-001");
await page.fill("#name", "Audit Item Ref Product");
await page.fill("#quantity", "10");
await page.click('button[type="submit"]');
await page.waitForURL("**/stock", { timeout: 15000 });

await page.goto("http://localhost:3000/bons-de-commande/nouveau");
await page.click('button:has-text("Nouveau client")');
await page.fill('input[name="newCustomerName"]', "Audit Item Ref Client");

// Row 1: pick the product, confirm the reference field auto-fills.
const productSelect = page.locator("select").nth(1);
await productSelect.selectOption({ label: "AUDIT-ITEMREF-001 · Audit Item Ref Product" });
const refInput1 = page.locator('input[placeholder="Référence"]').nth(0);
const autoFilledRef = await refInput1.inputValue();
console.log("Auto-filled reference from product select:", autoFilledRef);

// Row 2: add a free-text line with a manually-typed reference.
await page.click('button:has-text("Ajouter une ligne")');
const refInput2 = page.locator('input[placeholder="Référence"]').nth(1);
await refInput2.fill("MANUAL-REF-99");
const descInput2 = page.locator('input[placeholder="Désignation"]').nth(1);
await descInput2.fill("Ligne libre avec ref manuelle");
await page.locator('input[type="number"]').nth(2).fill("50"); // row 2's unit price

await page.click('button:has-text("Créer le bon de commande")');
await page.waitForURL(
  (url) => /\/bons-de-commande\/[a-zA-Z0-9]+$/.test(url.pathname) && !url.pathname.endsWith("/nouveau"),
  { timeout: 15000 }
);
const orderUrl = page.url();

const pageText = await page.locator("body").innerText();
console.log("Detail page shows product ref (AUDIT-ITEMREF-001):", pageText.includes("AUDIT-ITEMREF-001"));
console.log("Detail page shows manual ref (MANUAL-REF-99):", pageText.includes("MANUAL-REF-99"));

const pdfResp = await page.request.get(`${orderUrl}/pdf`);
console.log("PDF status:", pdfResp.status());

await browser.close();
