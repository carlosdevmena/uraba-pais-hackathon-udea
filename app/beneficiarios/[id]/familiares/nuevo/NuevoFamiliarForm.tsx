"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { agregarFamiliar, type ActionState } from "../../../actions";
import { buttonPrimary, buttonSecondary, cardPadded, inputClass } from "@/components/ui";

const initialState: ActionState = {};
const HOY = new Date().toISOString().slice(0, 10);
const HACE_120_ANIOS = new Date(new Date().setFullYear(new Date().getFullYear() - 120))
  .toISOString()
  .slice(0, 10);

export default function NuevoFamiliarForm({ beneficiarioId }: { beneficiarioId: string }) {
  const [state, formAction, pending] = useActionState(agregarFamiliar, initialState);

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
        <span className="font-medium text-slate-700">Nombre del familiar *</span>
        <input
          name="nombres"
          required
          minLength={2}
          maxLength={100}
          pattern="[A-Za-zÁÉÍÓÚÑÜáéíóúñü' -]+"
          title="Solo letras y espacios"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Parentesco *</span>
        <input name="parentesco" required minLength={2} placeholder="Hijo/a, cónyuge, etc." className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Fecha de nacimiento</span>
        <input type="date" name="fechaNacimiento" max={HOY} min={HACE_120_ANIOS} className={inputClass} />
      </label>

      <div className="flex justify-end gap-3 sm:col-span-2">
        <Link href={`/beneficiarios/${beneficiarioId}`} className={buttonSecondary}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Guardando..." : "Guardar familiar"}
        </button>
      </div>
    </form>
  );
}
