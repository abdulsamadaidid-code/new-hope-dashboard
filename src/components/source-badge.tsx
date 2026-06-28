import type { ValueSource } from "@/lib/types";

const labels: Record<ValueSource, string> = {
  actual: "Actual",
  forecast: "Forecast",
  manual_override: "Pinned",
};

const styles: Record<ValueSource, string> = {
  actual: "border-slate-300 bg-white text-slate-700",
  forecast: "border-dashed border-slate-300 bg-slate-50 text-slate-600",
  manual_override: "border-amber-300 bg-amber-50 text-amber-800",
};

export function SourceBadge({
  source,
  explain,
}: {
  source: ValueSource;
  explain?: string;
}) {
  return (
    <span
      title={explain}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[source]}`}
    >
      {source === "manual_override" ? <span aria-hidden>📌</span> : null}
      {labels[source]}
    </span>
  );
}

export function ValueCell({
  value,
  source,
  explain,
  formatted,
}: {
  value: number;
  source: ValueSource;
  explain?: string;
  formatted: string;
}) {
  return (
    <div className="space-y-1">
      <div
        className={
          source === "forecast"
            ? "font-medium text-slate-700 italic"
            : "font-medium text-slate-900"
        }
        title={explain}
      >
        {formatted}
      </div>
      <SourceBadge source={source} explain={explain} />
    </div>
  );
}
