"use client";

import { useActionState } from "react";
import { CircleDollarSign } from "lucide-react";
import { recordPayment } from "@/actions/invoices";
import type { ActionState } from "@/actions/invoices";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    recordPayment,
    undefined
  );

  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        <CircleDollarSign size={16} />
        Enregistrer un paiement
      </h2>
      <form action={formAction} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="invoiceId" value={invoiceId} />

        <div className="w-36">
          <Field label="Montant">
            <Input type="number" step="0.01" name="amount" required />
          </Field>
        </div>

        <div className="w-48">
          <Field label="Méthode">
            <Input name="method" placeholder="Espèces, virement..." />
          </Field>
        </div>

        <Button type="submit" disabled={isPending} variant="secondary">
          {isPending ? "Enregistrement..." : "Enregistrer le paiement"}
        </Button>

        {state?.error && (
          <p className="w-full text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </Card>
  );
}
