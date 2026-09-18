"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

export type ToastData = {
  tipo: "error" | "warning";
  mensaje: string;
  duplicadoId?: string;
} | null;

export default function Toast({ data }: { data: ToastData }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!data) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, [data]);

  if (!data || !visible) return null;

  const tono = data.tipo === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-orange-200 bg-orange-50 text-orange-800";

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-[fadeIn_0.2s_ease-out]">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${tono}`}>
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">
          <p>{data.mensaje}</p>
          {data.duplicadoId && (
            <Link
              href={`/beneficiarios/${data.duplicadoId}`}
              className="mt-1 inline-flex items-center gap-1 font-medium underline"
            >
              Abrir ficha existente <ArrowRight size={14} />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded-full p-0.5 hover:bg-black/5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
