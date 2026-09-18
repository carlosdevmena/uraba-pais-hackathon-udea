"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { actualizarSeguimiento, finalizarSeguimiento, type ActionState } from "../../../../actions";
import { buttonPrimary, buttonSecondary, cardPadded, inputClass } from "@/components/ui";

const initialState: ActionState = {};
const HOY = new Date().toISOString().slice(0, 10);

type SeguimientoValores = {
  id: string;
  avanceNovedad: string;
  observacion: string | null;
  accionPendiente: string | null;
  proximoContacto: string;
  fecha: string;
};

export default function EditarSeguimientoForm({
  beneficiarioId,
  seguimiento,
}: {
  beneficiarioId: string;
  seguimiento: SeguimientoValores;
}) {
  const [state, formAction, pending] = useActionState(actualizarSeguimiento, initialState);

  return (
    <div className="flex flex-col gap-4">
      {seguimiento.accionPendiente && (
        <form action={finalizarSeguimiento} className={`flex items-center justify-between gap-3 ${cardPadded}`}>
          <input type="hidden" name="seguimientoId" value={seguimiento.id} />
          <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              Acción pendiente: {seguimiento.accionPendiente}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Marca como finalizado si ya no requiere seguimiento — se confirma volviendo a la ficha.
            </p>
          </div>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-mint-400 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-mint-500"
          >
            <CheckCircle2 size={15} />
            Finalizar pendiente
          </button>
        </form>
      )}

      <form action={formAction} className={`grid gap-4 sm:grid-cols-2 ${cardPadded}`}>
        <input type="hidden" name="seguimientoId" value={seguimiento.id} />
        <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

        {state.error && (
          <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 sm:col-span-2 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {state.error}
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">Avance o novedad *</span>
          <input
            name="avanceNovedad"
            required
            minLength={3}
            maxLength={300}
            defaultValue={seguimiento.avanceNovedad}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Fecha</span>
          <input type="date" name="fecha" max={HOY} defaultValue={seguimiento.fecha} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Observación (opcional)</span>
          <input name="observacion" maxLength={300} defaultValue={seguimiento.observacion ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Acción pendiente (opcional)</span>
          <input
            name="accionPendiente"
            maxLength={200}
            defaultValue={seguimiento.accionPendiente ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Próximo contacto</span>
          <input
            type="date"
            name="proximoContacto"
            min={HOY}
            defaultValue={seguimiento.proximoContacto}
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-3 sm:col-span-2">
          <Link href={`/beneficiarios/${beneficiarioId}`} className={buttonSecondary}>
            Cancelar
          </Link>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
