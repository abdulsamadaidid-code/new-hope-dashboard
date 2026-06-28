import type { ReactNode } from "react";

export function SectionCard({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:rounded-lg print:shadow-none ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
