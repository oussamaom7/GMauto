"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updatePayment, deletePayment } from "@/actions/invoices";
import type { ActionState } from "@/actions/invoices";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
import { useToast } from "@/components/ui/ToastProvider";
import { Field, Input } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";

export type PaymentRow = {
  id: string;
  amount: number;
  date: string;
  method: string | null;
};

export function PaymentList({
  payments,
  currency,
  editable,
}: {
  payments: PaymentRow[];
  currency: CurrencyCode;
  editable: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Paiements</h2>
      <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {payments.map((p) =>
          editingId === p.id ? (
            <li key={p.id}>
              <EditPaymentForm
                payment={p}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={p.id} className="flex items-center gap-2">
              <span>
                {formatDate(new Date(p.date))} — {formatInvoiceAmount(p.amount, currency)}
                {p.method ? ` (${p.method})` : ""}
              </span>
              {editable && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingId(p.id)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800"
                    title="Modifier le paiement"
                  >
                    <Pencil size={14} />
                  </button>
                  <DeletePaymentButton paymentId={p.id} />
                </>
              )}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function EditPaymentForm({ payment, onDone }: { payment: PaymentRow; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await updatePayment(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <input type="hidden" name="paymentId" value={payment.id} />

      <div className="w-32">
        <Field label="Montant">
          <Input
            type="number"
            step="0.01"
            name="amount"
            required
            defaultValue={payment.amount}
          />
        </Field>
      </div>

      <div className="w-40">
        <Field label="Date">
          <Input type="date" name="date" required defaultValue={payment.date.slice(0, 10)} />
        </Field>
      </div>

      <div className="w-44">
        <Field label="Méthode">
          <Input
            name="method"
            placeholder="Espèces, virement..."
            defaultValue={payment.method ?? ""}
          />
        </Field>
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={onDone} disabled={isPending}>
        Annuler
      </Button>

      {state?.error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();

  async function handleClick() {
    if (!confirm("Supprimer ce paiement ? Le solde de la facture sera recalculé.")) return;

    setIsPending(true);
    try {
      await deletePayment(paymentId);
      showToast("Paiement supprimé.", "success");
    } catch {
      showToast("Échec de la suppression.", "error");
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-900/20"
      title="Supprimer le paiement"
    >
      <Trash2 size={14} />
    </button>
  );
}
