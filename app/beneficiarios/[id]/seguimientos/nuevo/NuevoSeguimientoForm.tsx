"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { registrarSeguimiento, type ActionState } from "../../../actions";
import { buttonPrimary, buttonSecondary, cardPadded, inputClass } from "@/components/ui";

const initialState: ActionState = {};
const HOY = new Date().toISOString().slice(0, 10);

export default function NuevoSeguimientoForm({ beneficiarioId }: { beneficiarioId: string }) {
  const [state, formAction, pending] = useActionState(registrarSeguimiento, initialState);

  return (
    <form action={formAction} className={`grid gap-4 sm:grid-cols-2 ${cardPadded}`}>
      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 sm:col-span-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Avance o novedad *</span>
        <input name="avanceNovedad" required minLength={3} maxLength={300} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Fecha</span>
        <input type="date" name="fecha" max={HOY} defaultValue={HOY} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Observación (opcional)</span>
        <input name="observacion" maxLength={300} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Acción pendiente (opcional)</span>
        <input name="accionPendiente" maxLength={200} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Próximo contacto</span>
        <input type="date" name="proximoContacto" min={HOY} className={inputClass} />
      </label>

      <div className="flex justify-end gap-3 sm:col-span-2">
        <Link href={`/beneficiarios/${beneficiarioId}`} className={buttonSecondary}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Guardando..." : "Añadir seguimiento"}
        </button>
      </div>
    </form>
  );
}
