import Link from "next/link";
import { Search, UserPlus, ArrowRight, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState, buttonPrimary, buttonSecondary, card } from "@/components/ui";

export const dynamic = "force-dynamic";

const ETIQUETAS_POBLACION: Record<string, string> = {
  migrante: "Migrante",
  refugiado: "Refugiado",
  desplazado: "Desplazado",
  retornado: "Retornado",
  victima_conflicto: "Víctima del conflicto",
  comunidad_acogida: "Comunidad de acogida",
  otro: "Otro",
};

const POR_PAGINA = 20;

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha);
}

export default async function BeneficiariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageRaw } = await searchParams;
  const texto = (q ?? "").trim();
  const pagina = Math.max(1, Number(pageRaw ?? "1") || 1);

  const where = texto
    ? {
        OR: [
          { nombres: { contains: texto, mode: "insensitive" as const } },
          { numeroDocumento: { contains: texto } },
          { codigoInterno: { contains: texto, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, beneficiarios] = await Promise.all([
    prisma.beneficiario.count({ where }),
    prisma.beneficiario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        _count: {
          select: { seguimientos: { where: { accionPendiente: { not: null } } } },
        },
      },
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hrefPagina = (p: number) => {
    const params = new URLSearchParams();
    if (texto) params.set("q", texto);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/beneficiarios?${query}` : "/beneficiarios";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Beneficiarios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total} beneficiario{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"} · Busca a la persona
            antes de registrar un nuevo caso.
          </p>
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
            className="w-full rounded-lg border-2 border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button type="submit" className={buttonPrimary}>
          <Search size={16} />
          Buscar
        </button>
      </form>

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-brand-50/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-brand-900/20 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombres</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">F. nacimiento</th>
                <th className="px-4 py-3">Género</th>
                <th className="px-4 py-3">Municipio</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Población</th>
                <th className="px-4 py-3">Datos</th>
                <th className="px-4 py-3">Seguimiento</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {beneficiarios.map((b) => (
                <tr key={b.id} className="transition hover:bg-brand-50/40 dark:hover:bg-brand-900/20">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">{b.codigoInterno}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{b.nombres}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {b.tipoDocumento && b.numeroDocumento
                      ? `${b.tipoDocumento} ${b.numeroDocumento}`
                      : "Sin documento"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatearFecha(b.fechaNacimiento)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.genero ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.municipio ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.telefono ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="blue">{ETIQUETAS_POBLACION[b.tipoPoblacion] ?? b.tipoPoblacion}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {b.autorizacionDatos ? (
                      <ShieldCheck size={16} className="text-yellow-600" aria-label="Autorización registrada" />
                    ) : (
                      <ShieldAlert size={16} className="text-orange-500" aria-label="Sin autorización" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b._count.seguimientos > 0 ? (
                      <Badge tone="amber">{b._count.seguimientos} pendiente{b._count.seguimientos === 1 ? "" : "s"}</Badge>
                    ) : (
                      <Badge tone="emerald">Al día</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/beneficiarios/${b.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
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
        {total > POR_PAGINA && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Página {pagina} de {totalPaginas} · mostrando {beneficiarios.length} de {total}
            </p>
            <div className="flex gap-2">
              <Link
                href={hrefPagina(pagina - 1)}
                aria-disabled={pagina <= 1}
                className={`${buttonSecondary} px-3 py-1.5 text-xs ${pagina <= 1 ? "pointer-events-none opacity-40" : ""}`}
              >
                <ChevronLeft size={14} />
                Anterior
              </Link>
              <Link
                href={hrefPagina(pagina + 1)}
                aria-disabled={pagina >= totalPaginas}
                className={`${buttonSecondary} px-3 py-1.5 text-xs ${pagina >= totalPaginas ? "pointer-events-none opacity-40" : ""}`}
              >
                Siguiente
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
