import { Loader2 } from "lucide-react";
import { card } from "@/components/ui";

export default function Cargando() {
  return (
    <div className="flex flex-col gap-6">
      <div className={`${card} h-40 animate-pulse bg-mint-50/40`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${card} h-24 animate-pulse bg-slate-100`} />
        <div className={`${card} h-24 animate-pulse bg-slate-100`} />
        <div className={`${card} h-24 animate-pulse bg-slate-100`} />
      </div>
      <div className={`${card} h-56 animate-pulse bg-slate-100`} />
      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        Cargando...
      </div>
    </div>
  );
}
