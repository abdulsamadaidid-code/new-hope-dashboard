import type { ActionStatus } from "@/lib/types";

const statusIcon: Record<ActionStatus, string> = {
  good: "🟢",
  warning: "🟡",
  critical: "🔴",
};

export function ActionItems({
  items,
}: {
  items: { status: ActionStatus; label: string; action: string }[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:shadow-none">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        Action Items
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <span aria-hidden>{statusIcon[item.status]}</span>
            <div>
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="text-slate-600">{item.action}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
