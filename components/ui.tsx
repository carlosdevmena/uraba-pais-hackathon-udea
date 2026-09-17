import type { ReactNode } from "react";

export const card = "rounded-xl border-2 border-slate-300 bg-white shadow-md shadow-slate-900/[0.06]";
export const cardPadded = `${card} p-5 sm:p-6`;

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700";

export const buttonGhost =
  "inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline-offset-2 hover:underline";

const badgeTones = {
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
} as const;

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cardPadded}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon && <span className="text-blue-600">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400">
      {children}
    </p>
  );
}
