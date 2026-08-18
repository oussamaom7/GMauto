"use client";

import { useActionState, useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";
import type { ActionState } from "@/actions/products";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

type ProductFormValues = {
  reference: string;
  name: string;
  quantity: number;
  rmb: number;
  rmbCurrency: CurrencyCode;
  sellingPrice: number | null;
  minimumStock: number;
  location: string;
  category: string;
  brand: string;
  imageUrl: string | null;
};

export function ProductForm({
  action,
  mode,
  initialValues,
  categoryOptions,
  brandOptions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  mode: "create" | "edit";
  initialValues?: Partial<ProductFormValues>;
  categoryOptions: string[];
  brandOptions: string[];
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? 0);
  const [rmb, setRmb] = useState(initialValues?.rmb ?? 0);
  const [rmbCurrency, setRmbCurrency] = useState<CurrencyCode>(
    initialValues?.rmbCurrency ?? "MAD"
  );

  const total = useMemo(() => quantity * rmb, [quantity, rmb]);

  return (
    <form action={formAction} className="max-w-2xl">
      <Card className="space-y-5">
        <Field label="Photo">
          <div className="flex items-center gap-4">
            {initialValues?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaUrl(initialValues.imageUrl) ?? undefined}
                alt=""
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
                <ImagePlus size={22} />
              </div>
            )}
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="block text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Référence" htmlFor="reference">
            <Input id="reference" name="reference" required defaultValue={initialValues?.reference} />
          </Field>
          <Field label="Désignation" htmlFor="name">
            <Input id="name" name="name" required defaultValue={initialValues?.name} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Catégorie" htmlFor="category">
            <Input id="category" name="category" list="category-options" defaultValue={initialValues?.category} />
            <datalist id="category-options">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Marque" htmlFor="brand">
            <Input id="brand" name="brand" list="brand-options" defaultValue={initialValues?.brand} />
            <datalist id="brand-options">
              {brandOptions.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {mode === "create" ? (
            <Field label="Quantité" htmlFor="quantity" hint="Laissez à 0 si inconnue pour l'instant.">
              <Input
                id="quantity"
                type="number"
                name="quantity"
                defaultValue={initialValues?.quantity ?? 0}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              />
            </Field>
          ) : (
            <Field label="Quantité (stock actuel)" hint="Utilisez « Ajuster le stock » pour la modifier.">
              <Input type="number" value={initialValues?.quantity ?? 0} disabled />
            </Field>
          )}

          <Field label="Prix unitaire" htmlFor="rmb" hint="Coût d'achat, dans la devise du fournisseur.">
            <div className="flex gap-2">
              <Input
                id="rmb"
                type="number"
                step="0.01"
                name="rmb"
                defaultValue={initialValues?.rmb ?? 0}
                onChange={(e) => setRmb(Number(e.target.value) || 0)}
                className="flex-1 text-lg font-semibold"
              />
              <Select
                name="rmbCurrency"
                value={rmbCurrency}
                onChange={(e) => setRmbCurrency(e.target.value as CurrencyCode)}
                className="w-24 shrink-0 text-lg font-semibold"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field label="Total">
            <Input
              type="text"
              readOnly
              value={formatCurrency(total, rmbCurrency)}
              className="text-lg font-semibold"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prix de vente" htmlFor="sellingPrice" hint="En MAD — utilisé par défaut sur les factures.">
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              name="sellingPrice"
              defaultValue={initialValues?.sellingPrice ?? undefined}
            />
          </Field>
          <Field label="Stock minimum" htmlFor="minimumStock">
            <Input
              id="minimumStock"
              type="number"
              name="minimumStock"
              defaultValue={initialValues?.minimumStock ?? 0}
            />
          </Field>
        </div>

        <Field label="Emplacement" htmlFor="location">
          <Input id="location" name="location" defaultValue={initialValues?.location} />
        </Field>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </Card>
    </form>
  );
}
