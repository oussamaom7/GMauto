const PALETTE_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];
const PALETTE_DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"];

const RADIUS = 52;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

type Segment = { label: string; count: number };

export function CategoryDonutChart({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aucune donnée de catégorie disponible.
      </p>
    );
  }

  const arcs = segments.reduce<{ label: string; length: number; offset: number }[]>(
    (acc, seg) => {
      const previous = acc[acc.length - 1];
      const offset = previous ? previous.offset + previous.length : 0;
      const length = (seg.count / total) * CIRCUMFERENCE;
      return [...acc, { label: seg.label, length, offset }];
    },
    []
  );

  return (
    <div className="flex items-center gap-6">
      <svg
        viewBox="0 0 120 120"
        className="h-32 w-32 shrink-0 -rotate-90"
        role="img"
        aria-label="Répartition des produits par catégorie"
      >
        <circle cx={60} cy={60} r={RADIUS} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-zinc-100 dark:text-zinc-800" />
        {arcs.map((arc, i) => {
          const dasharray = `${Math.max(arc.length - GAP, 0)} ${CIRCUMFERENCE - Math.max(arc.length - GAP, 0)}`;
          const dashoffset = -arc.offset;
          return (
            <circle
              key={arc.label}
              cx={60}
              cy={60}
              r={RADIUS}
              fill="none"
              stroke={`var(--donut-${i % PALETTE_LIGHT.length})`}
              strokeWidth={STROKE}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
            />
          );
        })}
        <style>
          {PALETTE_LIGHT.map(
            (c, i) => `:root { --donut-${i}: ${c}; } @media (prefers-color-scheme: dark) { :root { --donut-${i}: ${PALETTE_DARK[i]}; } }`
          ).join("\n")}
        </style>
      </svg>

      <ul className="space-y-2 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: `var(--donut-${i % PALETTE_LIGHT.length})` }}
            />
            <span className="text-zinc-600 dark:text-zinc-300">{seg.label}</span>
            <span className="ml-auto font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
              {Math.round((seg.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
