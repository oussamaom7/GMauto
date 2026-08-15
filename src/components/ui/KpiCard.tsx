import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

const TONES = {
  default: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-3.5">
      {icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
      </div>
    </Card>
  );
}
