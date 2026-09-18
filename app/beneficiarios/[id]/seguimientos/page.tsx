import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState, FormPageHeader, buttonSecondary, card } from "@/components/ui";
import TimelineSeguimientos from "@/components/TimelineSeguimientos";

export const dynamic = "force-dynamic";

const POR_PAGINA = 10;

export default async function SeguimientosBeneficiarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; pendientes?: string }>;
}) {
  const { id } = await params;
  const { page: pageRaw, pendientes: pendientesRaw } = await searchParams;
  const pagina = Math.max(1, Number(pageRaw ?? "1") || 1);
  const soloPendientes = pendientesRaw === "1";

  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: { id: true, nombres: true, codigoInterno: true },
  });
  if (!beneficiario) notFound();

  const where = { beneficiarioId: id, ...(soloPendientes ? { accionPendiente: { not: null } } : {}) };
  const [total, seguimientos] = await Promise.all([
    prisma.seguimiento.count({ where }),
    prisma.seguimiento.findMany({
      where,
      orderBy: { fecha: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hrefPagina = (p: number) => {
    const params = new URLSearchParams();
    if (soloPendientes) params.set("pendientes", "1");
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/beneficiarios/${id}/seguimientos?${query}` : `/beneficiarios/${id}/seguimientos`;
  };
  const volverA = hrefPagina(pagina);

  return (
    <div className="flex flex-col gap-6">
      <FormPageHeader
        beneficiarioId={id}
        codigoInterno={beneficiario.codigoInterno}
        nombres={beneficiario.nombres}
        titulo="Historial de seguimientos"
      />

      <div className="flex items-center gap-2 text-sm">
        <ClipboardList size={15} className="text-brand-700 dark:text-brand-300" />
        <span className="text-slate-500 dark:text-slate-400">
          {total} seguimiento{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"}
        </span>
        <Link
          href={soloPendientes ? `/beneficiarios/${id}/seguimientos` : `/beneficiarios/${id}/seguimientos?pendientes=1`}
          className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition ${
            soloPendientes
              ? "bg-brand-700 text-white hover:bg-brand-800"
              : "border border-slate-200 text-slate-600 hover:border-brand-200 hover:bg-brand-50/60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          {soloPendientes ? "Mostrando solo pendientes" : "Ver solo pendientes"}
        </Link>
      </div>

      <div className={`${card} p-4 sm:p-5`}>
        {seguimientos.length > 0 ? (
          <TimelineSeguimientos
            beneficiarioId={id}
            items={seguimientos}
            totalCount={total}
            offset={(pagina - 1) * POR_PAGINA}
            volverA={volverA}
          />
        ) : (
          <EmptyState>{soloPendientes ? "Sin seguimientos pendientes." : "Sin seguimientos registrados."}</EmptyState>
        )}
        {total > POR_PAGINA && (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Página {pagina} de {totalPaginas}
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
