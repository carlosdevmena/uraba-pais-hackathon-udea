import Link from "next/link";
import { Search, UserPlus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState, buttonPrimary, card } from "@/components/ui";

const ETIQUETAS_POBLACION: Record<string, string> = {
  migrante: "Migrante",
  refugiado: "Refugiado",
  desplazado: "Desplazado",
  victima_conflicto: "Víctima del conflicto",
  comunidad_acogida: "Comunidad de acogida",
  otro: "Otro",
};

export default async function BeneficiariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const texto = (q ?? "").trim();

  const beneficiarios = await prisma.beneficiario.findMany({
    where: texto
      ? {
          OR: [
            { nombres: { contains: texto, mode: "insensitive" } },
            { numeroDocumento: { contains: texto } },
            { codigoInterno: { contains: texto, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Beneficiarios</h1>
          <p className="text-sm text-slate-500">Busca a la persona antes de registrar un nuevo caso.</p>
        </div>
        <Link href="/beneficiarios/nuevo" className={buttonPrimary}>
          <UserPlus size={16} />
          Registrar beneficiario
        </Link>
      </div>

      <form className="flex max-w-lg gap-2" action="/beneficiarios">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={texto}
            placeholder="Buscar por nombre, documento o código interno..."
            className="w-full rounded-lg border-2 border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <button type="submit" className={buttonPrimary}>
          <Search size={16} />
          Buscar
        </button>
      </form>

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-blue-50/50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombres</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Municipio</th>
                <th className="px-4 py-3">Población</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiarios.map((b) => (
                <tr key={b.id} className="transition hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{b.codigoInterno}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{b.nombres}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.tipoDocumento && b.numeroDocumento
                      ? `${b.tipoDocumento} ${b.numeroDocumento}`
                      : "Sin documento"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.municipio ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="blue">{ETIQUETAS_POBLACION[b.tipoPoblacion] ?? b.tipoPoblacion}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/beneficiarios/${b.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                    >
                      Ver ficha <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {beneficiarios.length === 0 && (
          <div className="p-6">
            <EmptyState>No se encontraron beneficiarios{texto ? ` para "${texto}"` : ""}.</EmptyState>
          </div>
        )}
      </div>
    </div>
  );
}
