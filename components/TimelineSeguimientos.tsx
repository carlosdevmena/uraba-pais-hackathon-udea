import Link from "next/link";
import { CheckCircle2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui";
import { finalizarSeguimiento } from "@/app/beneficiarios/actions";

export type SeguimientoTimelineItem = {
  id: string;
  fecha: Date;
  avanceNovedad: string;
  observacion: string | null;
  accionPendiente: string | null;
  proximoContacto: Date | null;
};

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha);
}

/**
 * Línea de tiempo de seguimientos: cada tarjeta es el "siguiente paso" del
 * caso (no hay un campo de estado independiente — ver docs/PRESENTACION.md).
 * Compartido entre la ficha (últimos 5) y el historial completo paginado.
 */
export default function TimelineSeguimientos({
  beneficiarioId,
  items,
  volverA,
  totalCount,
  offset = 0,
}: {
  beneficiarioId: string;
  items: SeguimientoTimelineItem[];
  volverA?: string;
  /** Total real de seguimientos del beneficiario (puede ser mayor que `items.length` si esta es una vista parcial). */
  totalCount?: number;
  /** Cuántos seguimientos más recientes que `items[0]` no están en esta página (para numerar "Paso N" correctamente). */
  offset?: number;
}) {
  const total = totalCount ?? items.length;
  return (
    <ol className="relative flex flex-col gap-6 border-l-2 border-brand-200 pl-6 dark:border-brand-800">
      {items.map((s, i) => (
        <li key={s.id} className="relative">
          <span
            className={`absolute -left-[1.97rem] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
              s.accionPendiente ? "bg-amber-500" : "bg-emerald-500"
            }`}
            aria-hidden="true"
          />
          <div className="rounded-lg border-2 border-brand-300 bg-brand-50/50 p-4 text-sm transition hover:border-brand-400 dark:border-brand-800 dark:bg-brand-900/10 dark:hover:border-brand-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-800 dark:text-brand-300">
                Paso {total - offset - i} · {formatearFecha(s.fecha)}
              </span>
              <div className="flex items-center gap-2">
                {s.accionPendiente ? (
                  <Badge tone="amber">Acción pendiente</Badge>
                ) : (
                  <Badge tone="emerald">Sin pendientes</Badge>
                )}
                <Link
                  href={`/beneficiarios/${beneficiarioId}/seguimientos/${s.id}/editar`}
                  className="flex items-center gap-1 text-xs font-medium text-brand-800 transition hover:underline dark:text-brand-300"
                >
                  <Pencil size={12} />
                  Editar
                </Link>
                {s.accionPendiente && (
                  <form action={finalizarSeguimiento}>
                    <input type="hidden" name="seguimientoId" value={s.id} />
                    <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
                    {volverA && <input type="hidden" name="volverA" value={volverA} />}
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs font-medium text-mint-700 transition hover:underline dark:text-mint-400"
                    >
                      <CheckCircle2 size={12} />
                      Finalizar
                    </button>
                  </form>
                )}
              </div>
            </div>
            <p className="mt-2 font-medium text-slate-900 dark:text-slate-100">{s.avanceNovedad}</p>
            {s.observacion && (
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Observación: </span>
                {s.observacion}
              </p>
            )}
            {s.accionPendiente && (
              <div className="mt-2 rounded-md bg-orange-100/70 px-3 py-2 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200">
                <p>
                  <span className="font-semibold">Acción pendiente: </span>
                  {s.accionPendiente}
                </p>
                {s.proximoContacto && (
                  <p className="mt-0.5">
                    <span className="font-semibold">Próximo contacto: </span>
                    {formatearFecha(s.proximoContacto)}
                  </p>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
