"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { updateSettings } from "@/actions/settings";
import type { ActionState } from "@/actions/settings";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";
import { resolveMediaUrl } from "@/lib/media";

type SettingsValues = {
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  ice: string | null;
  defaultVatRate: number;
  invoicePrefix: string;
  invoiceNumberPadding: number;
  companyLogoUrl: string | null;
};

export function SettingsForm({ initialValues }: { initialValues: SettingsValues }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSettings,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      router.refresh();
    }
    wasPending.current = isPending;
  }, [isPending, state, router]);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Société</h2>

        <Field label="Logo">
          <div className="flex items-center gap-4">
            {initialValues.companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaUrl(initialValues.companyLogoUrl) ?? undefined}
                alt=""
                className="h-16 w-16 rounded-lg object-contain ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
                <Building2 size={22} />
              </div>
            )}
            <input
              type="file"
              name="logo"
              accept="image/*"
              className="block text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200"
            />
          </div>
        </Field>

        <Field label="Nom de la société" htmlFor="companyName">
          <Input id="companyName" name="companyName" required defaultValue={initialValues.companyName} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="companyPhone">
            <Input id="companyPhone" name="companyPhone" defaultValue={initialValues.companyPhone ?? undefined} />
          </Field>
          <Field label="Email" htmlFor="companyEmail">
            <Input
              id="companyEmail"
              type="email"
              name="companyEmail"
              defaultValue={initialValues.companyEmail ?? undefined}
            />
          </Field>
        </div>

        <Field label="Adresse" htmlFor="companyAddress">
          <Input id="companyAddress" name="companyAddress" defaultValue={initialValues.companyAddress ?? undefined} />
        </Field>

        <Field label="ICE" htmlFor="ice" hint="Identifiant Commun de l'Entreprise">
          <Input id="ice" name="ice" defaultValue={initialValues.ice ?? undefined} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Facturation</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="TVA par défaut (%)" htmlFor="defaultVatRate">
            <Input
              id="defaultVatRate"
              type="number"
              step="0.01"
              name="defaultVatRate"
              required
              defaultValue={initialValues.defaultVatRate}
            />
          </Field>
          <Field label="Préfixe de facture" htmlFor="invoicePrefix">
            <Input id="invoicePrefix" name="invoicePrefix" required defaultValue={initialValues.invoicePrefix} />
          </Field>
          <Field label="Chiffres du numéro" htmlFor="invoiceNumberPadding">
            <Input
              id="invoiceNumberPadding"
              type="number"
              name="invoiceNumberPadding"
              required
              defaultValue={initialValues.invoiceNumberPadding}
            />
          </Field>
        </div>
      </Card>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
