import { Loader2 } from "lucide-react";
import { card } from "@/components/ui";

export default function CargandoFicha() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${card} h-24 animate-pulse p-5 sm:p-6`} />
      ))}
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        Cargando ficha del beneficiario...
      </div>
    </div>
  );
}
