import { Loader2 } from "lucide-react";
import { card } from "@/components/ui";

export default function CargandoBeneficiarios() {
  return (
    <div className="flex flex-col gap-6">
      <div className={`${card} h-14 animate-pulse bg-mint-50/40`} />
      <div className={`${card} h-10 max-w-lg animate-pulse bg-slate-100`} />
      <div className={`${card} h-72 animate-pulse bg-slate-100`} />
      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        Buscando beneficiarios...
      </div>
    </div>
  );
}
