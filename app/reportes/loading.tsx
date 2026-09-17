import { Loader2 } from "lucide-react";
import { card } from "@/components/ui";

export default function CargandoReportes() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} h-28 animate-pulse p-5`} />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        Calculando indicadores...
      </div>
    </div>
  );
}
