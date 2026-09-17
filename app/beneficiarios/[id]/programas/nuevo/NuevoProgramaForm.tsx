"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { vincularPrograma, type ActionState } from "../../../actions";
import { buttonPrimary, buttonSecondary, cardPadded, inputClass } from "@/components/ui";

const initialState: ActionState = {};
const HOY = new Date().toISOString().slice(0, 10);

const ETIQUETAS_ESTADO: Record<string, string> = {
  inscrito: "Inscrito",
  en_proceso: "En proceso",
  finalizado: "Finalizado",
  retirado: "Retirado",
};

export default function NuevoProgramaForm({
  beneficiarioId,
  programas,
}: {
  beneficiarioId: string;
  programas: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(vincularPrograma, initialState);

  return (
    <form action={formAction} className={`grid gap-4 sm:grid-cols-2 ${cardPadded}`}>
      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 sm:col-span-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p>{state.error}</p>
            {state.participacionEditarHref && (
              <Link
                href={state.participacionEditarHref}
                className="mt-1 inline-flex items-center gap-1 font-medium underline"
              >
                Editar vinculación existente <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Programa *</span>
        <select name="programaId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Seleccionar programa...
          </option>
          {programas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Fecha de vinculación</span>
        <input type="date" name="fechaVinculacion" max={HOY} defaultValue={HOY} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Estado</span>
        <select name="estado" defaultValue="inscrito" className={inputClass}>
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
          {pending ? "Guardando..." : "Vincular a programa"}
        </button>
      </div>
    </form>
  );
}
