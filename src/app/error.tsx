"use client";

import { useEffect } from "react";

// Catch-all error boundary. Without it, any failure while rendering a page
// (typically the database being unreachable) surfaces as a raw 500.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-[#0b0e14]">
      <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Une erreur est survenue
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Impossible de charger cette page. La connexion à la base de données
          est peut-être indisponible. Réessayez dans un instant.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-zinc-400">Réf. : {error.digest}</p>
        )}
        <button
          onClick={() => retry()}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
