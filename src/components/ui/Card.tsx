import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padding = "md",
}: {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}) {
  const paddingClass = padding === "none" ? "" : padding === "sm" ? "p-4" : "p-6";
  return (
    <div
      className={`rounded-xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/[0.03] dark:border-zinc-800 dark:bg-zinc-900/60 ${paddingClass} ${className}`}
    >
      {children}
    </div>
  );
}
