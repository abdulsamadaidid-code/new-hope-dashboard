import { copy, friendlyExplain } from "@/lib/copy";
import type { ValueSource } from "@/lib/types";

const styles: Record<ValueSource, string> = {
  actual: "border-emerald-200 bg-emerald-50 text-emerald-800",
  forecast: "border-slate-200 bg-slate-50 text-slate-600",
  manual_override: "border-amber-200 bg-amber-50 text-amber-900",
};

export function SourceBadge({
  source,
  explain,
}: {
  source: ValueSource;
  explain?: string;
}) {
  const label = copy.badges[source];
  const title = friendlyExplain(source, explain);

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[source]} print:hidden`}
    >
      {source === "manual_override" ? <span aria-hidden>📌</span> : null}
      {label}
    </span>
  );
}

export function ValueCell({
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
        title={friendlyExplain(source, explain)}
      >
        {formatted}
      </div>
      <SourceBadge source={source} explain={explain} />
    </div>
  );
}
