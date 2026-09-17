"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { actualizarEstadoParticipacion, type ActionState } from "../../../../actions";
import { buttonPrimary, buttonSecondary, cardPadded, inputClass } from "@/components/ui";

const initialState: ActionState = {};

const ETIQUETAS_ESTADO: Record<string, string> = {
  inscrito: "Inscrito",
  en_proceso: "En proceso",
  finalizado: "Finalizado",
  retirado: "Retirado",
};

export default function EditarParticipacionForm({
  beneficiarioId,
  participacionId,
  estadoActual,
}: {
  beneficiarioId: string;
  participacionId: string;
  estadoActual: string;
}) {
  const [state, formAction, pending] = useActionState(actualizarEstadoParticipacion, initialState);

  return (
    <form action={formAction} className={`grid gap-4 sm:grid-cols-2 ${cardPadded}`}>
      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />
      <input type="hidden" name="participacionId" value={participacionId} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 sm:col-span-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Nuevo estado *</span>
        <select name="estado" required defaultValue={estadoActual} className={inputClass}>
          {Object.entries(ETIQUETAS_ESTADO).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex justify-end gap-3 sm:col-span-2">
        <Link href={`/beneficiarios/${beneficiarioId}`} className={buttonSecondary}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Guardando..." : "Actualizar estado"}
        </button>
      </div>
    </form>
  );
}
