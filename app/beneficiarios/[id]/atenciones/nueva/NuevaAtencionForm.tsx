"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { registrarAtencion, type ActionState } from "../../../actions";
import { buttonPrimary, buttonSecondary, cardPadded, inputClass } from "@/components/ui";

const initialState: ActionState = {};
const HOY = new Date().toISOString().slice(0, 10);

export default function NuevaAtencionForm({ beneficiarioId }: { beneficiarioId: string }) {
  const [state, formAction, pending] = useActionState(registrarAtencion, initialState);

  return (
    <form action={formAction} className={`grid gap-4 sm:grid-cols-2 ${cardPadded}`}>
      <input type="hidden" name="beneficiarioId" value={beneficiarioId} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 sm:col-span-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Tipo *</span>
        <input name="tipo" placeholder="Ej. ayuda humanitaria" required minLength={2} maxLength={80} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Fecha</span>
        <input type="date" name="fecha" max={HOY} defaultValue={HOY} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Descripción breve *</span>
        <input name="descripcion" required minLength={5} maxLength={300} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Responsable o entidad *</span>
        <input name="responsable" required minLength={2} maxLength={100} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Resultado *</span>
        <input name="resultado" required minLength={2} maxLength={200} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Remisión (opcional)</span>
        <input name="remision" maxLength={200} className={inputClass} />
      </label>

      <div className="flex justify-end gap-3 sm:col-span-2">
        <Link href={`/beneficiarios/${beneficiarioId}`} className={buttonSecondary}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Guardando..." : "Registrar atención"}
        </button>
      </div>
    </form>
  );
}
