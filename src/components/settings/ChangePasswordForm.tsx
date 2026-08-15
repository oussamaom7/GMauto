"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword } from "@/actions/auth";
import type { ActionState } from "@/actions/auth";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    changePassword,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  const showSuccess = attempted && !isPending && !state?.error;

  return (
    <Card className="max-w-2xl space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        <KeyRound size={16} />
        Mot de passe
      </h2>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={() => setAttempted(true)}
        className="space-y-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <Field label="Mot de passe actuel" htmlFor="currentPassword">
            <Input id="currentPassword" type="password" name="currentPassword" required />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="newPassword">
            <Input id="newPassword" type="password" name="newPassword" required minLength={8} />
          </Field>
          <Field label="Confirmer" htmlFor="confirmPassword">
            <Input id="confirmPassword" type="password" name="confirmPassword" required minLength={8} />
          </Field>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
            {state.error}
          </p>
        )}
        {showSuccess && <p className="text-sm text-emerald-600">Mot de passe mis à jour.</p>}

        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Modification..." : "Changer le mot de passe"}
        </Button>
      </form>
    </Card>
  );
}
