"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle } from "lucide-react";

type Alert = {
  id: string;
  reference: string;
  name: string;
  quantity: number;
  minimumStock: number;
};

export function NotificationBell({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {alerts.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Alertes de stock
          </p>
          {alerts.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-500">Aucune alerte pour le moment.</p>
          ) : (
            <ul className="max-h-80 space-y-0.5 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/stock/${a.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <AlertTriangle
                      size={14}
                      className={a.quantity <= 0 ? "shrink-0 text-red-500" : "shrink-0 text-orange-500"}
                    />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                      {a.quantity}/{a.minimumStock}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
