"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { formatInvoiceAmount } from "@/lib/format";
import { CURRENCIES, fromMad, toMad, type CurrencyCode } from "@/lib/currency";
import type { ActionState } from "@/actions/invoices";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Label } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";
import { ProductCombobox, type ProductOption } from "@/components/stock/ProductCombobox";

type CustomerOption = { id: string; name: string };

// quantity/unitPrice are kept as raw strings (not numbers) so a controlled
// input can hold an empty intermediate state while typing — with a number,
// clearing the field to retype snaps back to 0 before the next keystroke
// lands, producing artifacts like "0778" instead of "778".
type LineItem = {
  key: string;
  productId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
};

type ExchangeRates = { eurToMad: number; usdToMad: number; cnyToMad: number };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select();
}

export function InvoiceForm({
  action,
  customers,
  products: initialProducts,
  vatRate,
  rates,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  customers: CustomerOption[];
  products: ProductOption[];
  vatRate: number;
  rates: ExchangeRates;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [products, setProducts] = useState(initialProducts);
  const nextKey = useRef(1);
  const [items, setItems] = useState<LineItem[]>([
    { key: "row-0", productId: null, description: "", quantity: "1", unitPrice: "" },
  ]);
  const [paidAmount, setPaidAmount] = useState("0");
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    customers.length > 0 ? "existing" : "new"
  );
  const [applyVat, setApplyVat] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>("MAD");

  function addRow() {
    setItems((rows) => [
      ...rows,
      {
        key: `row-${nextKey.current++}`,
        productId: null,
        description: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);
  }

  function removeRow(key: string) {
    setItems((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  function updateRow(key: string, patch: Partial<LineItem>) {
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function onProductSelect(key: string, productId: string) {
    if (!productId) {
      updateRow(key, { productId: null });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    applyProductToRow(key, product);
  }

  // sellingPrice is stored in MAD; rmb is in its own currency. Convert
  // whichever we use as the prefill into the invoice's selected currency.
  function applyProductToRow(key: string, product: ProductOption) {
    const priceInMad = product.sellingPrice ?? toMad(product.rmb, product.rmbCurrency, rates);
    updateRow(key, {
      productId: product.id,
      description: product.name,
      unitPrice: String(Math.round(fromMad(priceInMad, currency, rates) * 100) / 100),
    });
  }

  function handleProductCreated(key: string, product: ProductOption) {
    setProducts((list) => [...list, product]);
    applyProductToRow(key, product);
    // The quantity typed in the quick-create panel is what the shop meant to
    // put on this line — carry it over instead of leaving the row's own
    // quantity (still whatever it defaulted to) out of sync with it.
    if (product.quantity > 0) {
      updateRow(key, { quantity: String(product.quantity) });
    }
  }

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );
  const vatAmount = applyVat ? subtotal * (vatRate / 100) : 0;
  const total = subtotal + vatAmount;
  const remaining = Math.max(total - (Number(paidAmount) || 0), 0);

  const itemsJson = JSON.stringify(
    items
      .filter((i) => i.description.trim().length > 0 && Number(i.quantity) > 0)
      .map((i) => ({
        productId: i.productId,
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
      }))
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Label className="mb-0">Client</Label>
          {customers.length > 0 && (
            <div className="flex overflow-hidden rounded-lg border border-zinc-200 text-xs font-medium dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className={`px-3 py-1.5 transition-colors ${
                  clientMode === "existing"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                Client existant
              </button>
              <button
                type="button"
                onClick={() => setClientMode("new")}
                className={`px-3 py-1.5 transition-colors ${
                  clientMode === "new"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                Nouveau client
              </button>
            </div>
          )}
        </div>

        {clientMode === "existing" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select name="customerId" required>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Field label="Date" htmlFor="date">
              <Input type="date" id="date" name="date" required defaultValue={todayISO()} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Input name="newCustomerName" placeholder="Nom du client" required />
            <Input name="newCustomerPhone" placeholder="Téléphone" />
            <Input name="newCustomerEmail" type="email" placeholder="Email" />
            <Field label="Date" htmlFor="date">
              <Input type="date" id="date" name="date" required defaultValue={todayISO()} />
            </Field>
          </div>
        )}

        <div className="mt-4">
          <Field label="Devise de la facture" htmlFor="currency">
            <Select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="max-w-[160px]"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Produits</h2>

        <div className="space-y-3">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const insufficientStock =
              product && product.quantity - (Number(item.quantity) || 0) < 0;

            return (
              <div
                key={item.key}
                className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-12">
                  <div className="col-span-2 sm:col-span-3">
                    <ProductCombobox
                      products={products}
                      value={item.productId}
                      onSelect={(id) => onProductSelect(item.key, id ?? "")}
                      onProductCreated={(product) => handleProductCreated(item.key, product)}
                    />
                  </div>

                  <Input
                    className="col-span-2 sm:col-span-4"
                    placeholder="Désignation"
                    value={item.description}
                    onChange={(e) => updateRow(item.key, { description: e.target.value })}
                  />

                  <Input
                    type="number"
                    min={1}
                    className="col-span-1"
                    value={item.quantity}
                    onChange={(e) => updateRow(item.key, { quantity: e.target.value })}
                    onFocus={selectAllOnFocus}
                  />

                  <Input
                    type="number"
                    step="0.01"
                    className="col-span-1 sm:col-span-2"
                    value={item.unitPrice}
                    onChange={(e) => updateRow(item.key, { unitPrice: e.target.value })}
                    onFocus={selectAllOnFocus}
                  />

                  <div className="col-span-1 flex items-center px-1 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300 sm:col-span-1 sm:justify-end">
                    {formatInvoiceAmount(
                      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                      currency
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(item.key)}
                    className="col-span-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 sm:col-span-1 sm:py-0"
                    title="Retirer la ligne"
                  >
                    <Trash2 size={16} />
                    <span className="sm:hidden">Retirer</span>
                  </button>
                </div>
                {insufficientStock && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={13} />
                    Stock insuffisant pour {product?.reference} (disponible {product?.quantity}, demandé {item.quantity})
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Plus size={15} />
          Ajouter une ligne
        </button>
      </Card>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-3">
          <Card className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Sous-total</span>
              <span className="tabular-nums">{formatInvoiceAmount(subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-1.5 text-zinc-500">
                <input
                  type="checkbox"
                  name="applyVat"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                TVA ({vatRate}%)
              </label>
              <span className="tabular-nums">{formatInvoiceAmount(vatAmount, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2.5 text-base font-semibold dark:border-zinc-800">
              <span>Total</span>
              <span className="tabular-nums">{formatInvoiceAmount(total, currency)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="paidAmount" className="mb-0 text-zinc-500">
                Payé
              </Label>
              <input
                id="paidAmount"
                type="number"
                step="0.01"
                name="paidAmount"
                min={0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                onFocus={selectAllOnFocus}
                className="w-28 rounded-lg border border-zinc-300 px-2 py-1 text-right text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Solde à payer</span>
              <span className="tabular-nums">{formatInvoiceAmount(remaining, currency)}</span>
            </div>
          </Card>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Génération..." : "Générer la facture"}
          </Button>
        </div>
      </div>
    </form>
  );
}
