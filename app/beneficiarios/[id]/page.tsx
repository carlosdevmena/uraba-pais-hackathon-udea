import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ShieldAlert, Users, Link2, HeartHandshake, ClipboardList, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, EmptyState, SectionCard, buttonGhost, card } from "@/components/ui";
import TimelineSeguimientos from "@/components/TimelineSeguimientos";

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

const ETIQUETAS_ESTADO: Record<string, string> = {
  inscrito: "Inscrito",
  en_proceso: "En proceso",
  finalizado: "Finalizado",
  retirado: "Retirado",
};

function formatearFecha(fecha: Date | null) {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(fecha);
}

function AgregarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonGhost}>
      <Plus size={14} />
      {children}
    </Link>
  );
}

export default async function FichaBeneficiarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [beneficiario, seguimientosPendientes] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      include: {
        familiares: { orderBy: { createdAt: "asc" } },
        participaciones: { include: { programa: true }, orderBy: { fechaVinculacion: "desc" } },
        atenciones: { orderBy: { fecha: "desc" } },
        seguimientos: { orderBy: { fecha: "desc" }, take: 5 },
        _count: { select: { seguimientos: true } },
      },
      relationLoadStrategy: "join",
    }),
    prisma.seguimiento.count({ where: { beneficiarioId: id, accionPendiente: { not: null } } }),
  ]);

  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Vista de solo consulta. Usa los enlaces &quot;+ Agregar&quot; de cada sección para registrar información
        nueva.
      </p>

      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-brand-700 dark:text-brand-300">{beneficiario.codigoInterno}</p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{beneficiario.nombres}</h1>
          </div>
          {beneficiario.autorizacionDatos ? (
            <Badge tone="emerald">
              <ShieldCheck size={13} className="mr-1 inline" /> Autorización de datos registrada
            </Badge>
          ) : (
            <Badge tone="amber">
              <ShieldAlert size={13} className="mr-1 inline" /> Sin autorización de datos
            </Badge>
          )}
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-400 dark:text-slate-500">Documento</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              {beneficiario.tipoDocumento && beneficiario.numeroDocumento
                ? `${beneficiario.tipoDocumento} ${beneficiario.numeroDocumento}`
                : "Sin documento"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500">Fecha de nacimiento</dt>
            <dd className="text-slate-800 dark:text-slate-200">{formatearFecha(beneficiario.fechaNacimiento)}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500">Género</dt>
            <dd className="text-slate-800 dark:text-slate-200">{beneficiario.genero ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500">Municipio</dt>
            <dd className="text-slate-800 dark:text-slate-200">{beneficiario.municipio ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500">Teléfono</dt>
            <dd className="text-slate-800 dark:text-slate-200">{beneficiario.telefono ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400 dark:text-slate-500">Población</dt>
            <dd className="text-slate-800 dark:text-slate-200">
              <Badge tone="blue">{ETIQUETAS_POBLACION[beneficiario.tipoPoblacion] ?? beneficiario.tipoPoblacion}</Badge>
              {beneficiario.discapacidad && (
                <span className="ml-2">
                  <Badge tone="slate">Discapacidad: {beneficiario.tipoDiscapacidad ?? "no especificada"}</Badge>
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <SectionCard
        title="Núcleo familiar"
        icon={<Users size={16} />}
        action={<AgregarLink href={`/beneficiarios/${beneficiario.id}/familiares/nuevo`}>Agregar familiar</AgregarLink>}
      >
        <ul className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-300">
          {beneficiario.familiares.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
              {f.nombres} <span className="text-slate-400 dark:text-slate-500">· {f.parentesco}</span>
            </li>
          ))}
        </ul>
        {beneficiario.familiares.length === 0 && (
          <EmptyState>Sin integrantes familiares registrados.</EmptyState>
        )}
      </SectionCard>

      <SectionCard
        title="Programas y participación"
        icon={<Link2 size={16} />}
        action={<AgregarLink href={`/beneficiarios/${beneficiario.id}/programas/nuevo`}>Vincular programa</AgregarLink>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <tr>
                <th className="py-2 pr-4">Programa</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {beneficiario.participaciones.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{p.programa.nombre}</td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{formatearFecha(p.fechaVinculacion)}</td>
                  <td className="py-2 pr-4">
                    <Badge
                      tone={
                        p.estado === "finalizado"
                          ? "emerald"
                          : p.estado === "en_proceso"
                            ? "amber"
                            : p.estado === "retirado"
                              ? "rose"
                              : "sky"
                      }
                    >
                      {ETIQUETAS_ESTADO[p.estado]}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Link
                      href={`/beneficiarios/${beneficiario.id}/programas/${p.id}/editar`}
                      className={buttonGhost}
                    >
                      Editar estado
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {beneficiario.participaciones.length === 0 && <EmptyState>Sin programas vinculados.</EmptyState>}
      </SectionCard>

      <SectionCard
        title="Atenciones y ayudas"
        icon={<HeartHandshake size={16} />}
        action={<AgregarLink href={`/beneficiarios/${beneficiario.id}/atenciones/nueva`}>Registrar atención</AgregarLink>}
      >
        <div className="flex flex-col gap-3">
          {beneficiario.atenciones.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border-2 border-brand-300 bg-brand-50/50 p-3 text-sm dark:border-brand-800 dark:bg-brand-900/10"
            >
              <div className="flex flex-wrap justify-between gap-2 text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-800 dark:text-slate-200">{a.tipo}</span>
                <span>{formatearFecha(a.fecha)}</span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-300">{a.descripcion}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Responsable: {a.responsable} · Resultado: {a.resultado}
                {a.remision ? ` · Remisión: ${a.remision}` : ""}
              </p>
            </div>
          ))}
        </div>
        {beneficiario.atenciones.length === 0 && <EmptyState>Sin atenciones registradas.</EmptyState>}
      </SectionCard>

      <SectionCard
        title="Seguimientos"
        icon={<ClipboardList size={16} />}
        action={<AgregarLink href={`/beneficiarios/${beneficiario.id}/seguimientos/nuevo`}>Añadir seguimiento</AgregarLink>}
      >
        {beneficiario._count.seguimientos > 0 && (
          <p className="-mt-1 mb-3 text-xs text-slate-500 dark:text-slate-400">
            {beneficiario._count.seguimientos} seguimiento{beneficiario._count.seguimientos === 1 ? "" : "s"}{" "}
            registrado{beneficiario._count.seguimientos === 1 ? "" : "s"} ·{" "}
            <span className="font-medium text-orange-700 dark:text-orange-400">
              {seguimientosPendientes} con acción pendiente
            </span>
          </p>
        )}
        {beneficiario.seguimientos.length > 0 ? (
          <TimelineSeguimientos
            beneficiarioId={beneficiario.id}
            items={beneficiario.seguimientos}
            totalCount={beneficiario._count.seguimientos}
          />
        ) : (
          <EmptyState>Sin seguimientos registrados.</EmptyState>
        )}
        {beneficiario._count.seguimientos > 5 && (
          <Link
            href={`/beneficiarios/${beneficiario.id}/seguimientos`}
            className="mt-3 inline-block text-sm font-medium text-brand-800 transition hover:underline dark:text-brand-300"
          >
            Ver historial completo ({beneficiario._count.seguimientos}) →
          </Link>
        )}
      </SectionCard>
    </div>
  );
}
