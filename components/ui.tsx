import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const card =
  "rounded-xl border-2 border-slate-300 bg-white shadow-md shadow-slate-900/[0.06] transition-shadow duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20";
export const cardPadded = `${card} p-5 sm:p-6`;

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-brand-900/40";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-700/20 transition-all duration-200 hover:scale-[1.03] hover:bg-brand-800 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";

export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:scale-[1.03] hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800 hover:shadow-sm active:scale-[0.97] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

export const buttonGhost =
  "inline-flex items-center gap-1 text-sm font-medium text-brand-800 underline-offset-2 transition-colors hover:underline dark:text-brand-300";

// Paleta de estado (semántica tipo semáforo, independiente del color
// institucional): verde = al día/finalizado, ámbar = pendiente/en proceso,
// rojo = urgente/retirado, azul = inscrito. "blue" se mantiene como el verde
// institucional de marca para etiquetas generales (ej. tipo de población).
const badgeTones = {
  blue: "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-700",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
  amber:
    "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800",
  sky: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
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
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {icon && <span className="text-brand-700 dark:text-brand-300">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function FormPageHeader({
  beneficiarioId,
  codigoInterno,
  nombres,
  titulo,
}: {
  beneficiarioId: string;
  codigoInterno: string;
  nombres: string;
  titulo: string;
}) {
  return (
    <div>
      <Link
        href={`/beneficiarios/${beneficiarioId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline dark:text-brand-300"
      >
        <ArrowLeft size={14} />
        Volver a la ficha
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{titulo}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {nombres} <span className="font-mono text-xs text-brand-700 dark:text-brand-300">({codigoInterno})</span>
      </p>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
      {children}
    </p>
  );
}
