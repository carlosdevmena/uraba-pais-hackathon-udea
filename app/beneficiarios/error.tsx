"use client";

import { AlertTriangle } from "lucide-react";
import { buttonPrimary, card } from "@/components/ui";

export default function ErrorBeneficiarios({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={`${card} flex flex-col items-center gap-3 p-8 text-center`}>
      <AlertTriangle size={28} className="text-orange-500" />
      <h2 className="text-lg font-semibold text-slate-900">Ocurrió un problema al cargar esta sección</h2>
      <p className="max-w-md text-sm text-slate-500">
        Puede ser una falla temporal de conexión con la base de datos. Intenta de nuevo; si el
        problema persiste, vuelve más tarde.
      </p>
      {process.env.NODE_ENV !== "production" && (
        <p className="max-w-md break-words text-xs text-slate-400">{error.message}</p>
      )}
      <button type="button" onClick={reset} className={buttonPrimary}>
        Reintentar
      </button>
    </div>
  );
}
