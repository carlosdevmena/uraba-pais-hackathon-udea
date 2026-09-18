import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, CheckCircle2, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { finalizarSeguimiento } from "../../actions";
import { Badge, EmptyState, FormPageHeader, buttonSecondary, card } from "@/components/ui";

export const dynamic = "force-dynamic";

const POR_PAGINA = 10;

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha);
}

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

  return (
    <div className="flex flex-col gap-6">
      <FormPageHeader
        beneficiarioId={id}
        codigoInterno={beneficiario.codigoInterno}
        nombres={beneficiario.nombres}
        titulo="Historial de seguimientos"
      />

      <div className="flex items-center gap-2 text-sm">
        <ClipboardList size={15} className="text-brand-700" />
        <span className="text-slate-500">{total} seguimiento{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"}</span>
        <Link
          href={soloPendientes ? `/beneficiarios/${id}/seguimientos` : `/beneficiarios/${id}/seguimientos?pendientes=1`}
          className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition ${
            soloPendientes
              ? "bg-brand-700 text-white hover:bg-brand-800"
              : "border border-slate-200 text-slate-600 hover:border-brand-200 hover:bg-brand-50/60"
          }`}
        >
          {soloPendientes ? "Mostrando solo pendientes" : "Ver solo pendientes"}
        </Link>
      </div>

      <div className={`${card} flex flex-col divide-y divide-slate-100 overflow-hidden`}>
        {seguimientos.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 p-4 transition hover:bg-brand-50/30 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                {formatearFecha(s.fecha)}
              </span>
              <div className="flex items-center gap-2">
                {s.accionPendiente ? (
                  <Badge tone="amber">Acción pendiente</Badge>
                ) : (
                  <Badge tone="emerald">Sin pendientes</Badge>
                )}
                <Link
                  href={`/beneficiarios/${id}/seguimientos/${s.id}/editar`}
                  className="flex items-center gap-1 text-xs font-medium text-brand-800 transition hover:underline"
                >
                  <Pencil size={13} />
                  Editar
                </Link>
                {s.accionPendiente && (
                  <form action={finalizarSeguimiento}>
                    <input type="hidden" name="seguimientoId" value={s.id} />
                    <input type="hidden" name="beneficiarioId" value={id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs font-medium text-mint-700 transition hover:underline"
                    >
                      <CheckCircle2 size={13} />
                      Finalizar
                    </button>
                  </form>
                )}
              </div>
            </div>
            <p className="font-medium text-slate-900">{s.avanceNovedad}</p>
            {s.observacion && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-700">Observación: </span>
                {s.observacion}
              </p>
            )}
            {s.accionPendiente && (
              <div className="rounded-md bg-orange-100/70 px-3 py-2 text-sm text-orange-900">
                <p>
                  <span className="font-semibold">Acción pendiente: </span>
                  {s.accionPendiente}
                </p>
                {s.proximoContacto && (
                  <p className="mt-0.5">
                    <span className="font-semibold">Próximo contacto: </span>
                    {formatearFecha(s.proximoContacto)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {seguimientos.length === 0 && (
          <div className="p-6">
            <EmptyState>
              {soloPendientes ? "Sin seguimientos pendientes." : "Sin seguimientos registrados."}
            </EmptyState>
          </div>
        )}
        {total > POR_PAGINA && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-xs text-slate-500">
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
