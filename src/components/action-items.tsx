import { SectionCard } from "@/components/section-card";
import { copy } from "@/lib/copy";
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
    <SectionCard title={copy.sections.actions} hint={copy.sections.actionsHint}>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <span aria-hidden className="text-base leading-none">
              {statusIcon[item.status]}
            </span>
            <div>
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="mt-0.5 text-slate-600">{item.action}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
