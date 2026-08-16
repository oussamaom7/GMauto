"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/customers";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";

export function CustomerForm({
  action,
  initialValues,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-lg">
      <Card className="space-y-4">
        <Field label="Nom" htmlFor="name">
          <Input id="name" name="name" required defaultValue={initialValues?.name} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={initialValues?.phone ?? undefined} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" name="email" defaultValue={initialValues?.email ?? undefined} />
          </Field>
        </div>

        <Field label="Adresse" htmlFor="address">
          <Input id="address" name="address" defaultValue={initialValues?.address ?? undefined} />
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
