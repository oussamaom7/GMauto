"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { adjustStock } from "@/actions/products";
import type { ActionState } from "@/actions/products";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";

export function AdjustStockForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    adjustStock,
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
    <Card>
      <form action={formAction} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="productId" value={productId} />

        <div className="w-48">
          <Field label="Ajustement" hint="Positif = entrée, négatif = sortie">
            <Input type="number" name="delta" required placeholder="ex: 5 ou -3" />
          </Field>
        </div>

        <div className="flex-1">
          <Field label="Motif">
            <Input name="note" required placeholder="ex: Correction inventaire" />
          </Field>
        </div>

        <Button type="submit" disabled={isPending} variant="secondary">
          {isPending ? "Ajustement..." : "Ajuster le stock"}
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
