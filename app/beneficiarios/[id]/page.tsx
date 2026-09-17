import { notFound } from "next/navigation";
import { ShieldCheck, ShieldAlert, Users, Link2, HeartHandshake, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  agregarFamiliar,
  registrarAtencion,
  registrarSeguimiento,
  vincularPrograma,
} from "../actions";
import { Badge, EmptyState, SectionCard, buttonSecondary, card, inputClass } from "@/components/ui";

export const dynamic = "force-dynamic";

const ETIQUETAS_POBLACION: Record<string, string> = {
  migrante: "Migrante",
  refugiado: "Refugiado",
  desplazado: "Desplazado",
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

export default async function FichaBeneficiarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [beneficiario, programas] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      include: {
        familiares: { orderBy: { createdAt: "asc" } },
        participaciones: { include: { programa: true }, orderBy: { fechaVinculacion: "desc" } },
        atenciones: { orderBy: { fecha: "desc" } },
        seguimientos: { orderBy: { fecha: "desc" } },
      },
    }),
    prisma.programa.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <section className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-blue-600">{beneficiario.codigoInterno}</p>
            <h1 className="text-xl font-semibold text-slate-900">{beneficiario.nombres}</h1>
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
            <dt className="text-slate-400">Documento</dt>
            <dd className="text-slate-800">
              {beneficiario.tipoDocumento && beneficiario.numeroDocumento
                ? `${beneficiario.tipoDocumento} ${beneficiario.numeroDocumento}`
                : "Sin documento"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Fecha de nacimiento</dt>
            <dd className="text-slate-800">{formatearFecha(beneficiario.fechaNacimiento)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Género</dt>
            <dd className="text-slate-800">{beneficiario.genero ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Municipio</dt>
            <dd className="text-slate-800">{beneficiario.municipio ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Teléfono</dt>
            <dd className="text-slate-800">{beneficiario.telefono ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Población</dt>
            <dd className="text-slate-800">
              <Badge tone="blue">{ETIQUETAS_POBLACION[beneficiario.tipoPoblacion] ?? beneficiario.tipoPoblacion}</Badge>
              {beneficiario.discapacidad && (
                <span className="ml-2">
                  <Badge tone="slate">Con discapacidad</Badge>
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <SectionCard title="Núcleo familiar" icon={<Users size={16} />}>
        <ul className="flex flex-col gap-1 text-sm text-slate-700">
          {beneficiario.familiares.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
              {f.nombres} <span className="text-slate-400">· {f.parentesco}</span>
            </li>
          ))}
        </ul>
        {beneficiario.familiares.length === 0 && (
          <EmptyState>Sin integrantes familiares registrados.</EmptyState>
        )}
        <form action={agregarFamiliar} className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-end">
          <input type="hidden" name="beneficiarioId" value={beneficiario.id} />
          <input name="nombres" placeholder="Nombre del familiar" required className={`${inputClass} sm:w-48`} />
          <input name="parentesco" placeholder="Parentesco" className={`${inputClass} sm:w-40`} />
          <input type="date" name="fechaNacimiento" className={`${inputClass} sm:w-auto`} />
          <button type="submit" className={`${buttonSecondary} sm:w-fit`}>
            Agregar familiar
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Programas y participación" icon={<Link2 size={16} />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 pr-4">Programa</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiario.participaciones.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 text-slate-800">{p.programa.nombre}</td>
                  <td className="py-2 pr-4 text-slate-500">{formatearFecha(p.fechaVinculacion)}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={p.estado === "finalizado" ? "emerald" : p.estado === "retirado" ? "slate" : "blue"}>
                      {ETIQUETAS_ESTADO[p.estado]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {beneficiario.participaciones.length === 0 && <EmptyState>Sin programas vinculados.</EmptyState>}
        <form action={vincularPrograma} className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-end">
          <input type="hidden" name="beneficiarioId" value={beneficiario.id} />
          <select name="programaId" required defaultValue="" className={`${inputClass} sm:w-56`}>
            <option value="" disabled>
              Seleccionar programa...
            </option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <input type="date" name="fechaVinculacion" className={`${inputClass} sm:w-auto`} />
          <select name="estado" defaultValue="inscrito" className={`${inputClass} sm:w-36`}>
            {Object.entries(ETIQUETAS_ESTADO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="submit" className={`${buttonSecondary} sm:w-fit`}>
            Vincular a programa
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Atenciones y ayudas" icon={<HeartHandshake size={16} />}>
        <div className="flex flex-col gap-3">
          {beneficiario.atenciones.map((a) => (
            <div key={a.id} className="rounded-lg border-2 border-blue-300 bg-blue-50/50 p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2 text-slate-500">
                <span className="font-medium text-slate-800">{a.tipo}</span>
                <span>{formatearFecha(a.fecha)}</span>
              </div>
              <p className="mt-1 text-slate-700">{a.descripcion}</p>
              <p className="mt-1 text-xs text-slate-500">
                Responsable: {a.responsable} · Resultado: {a.resultado}
                {a.remision ? ` · Remisión: ${a.remision}` : ""}
              </p>
            </div>
          ))}
        </div>
        {beneficiario.atenciones.length === 0 && <EmptyState>Sin atenciones registradas.</EmptyState>}
        <form action={registrarAtencion} className="mt-4 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="beneficiarioId" value={beneficiario.id} />
          <input name="tipo" placeholder="Tipo (ej. ayuda humanitaria)" required className={inputClass} />
          <input type="date" name="fecha" className={inputClass} />
          <input
            name="descripcion"
            placeholder="Descripción breve"
            required
            className={`${inputClass} sm:col-span-2`}
          />
          <input name="responsable" placeholder="Responsable o entidad" required className={inputClass} />
          <input name="resultado" placeholder="Resultado" required className={inputClass} />
          <input name="remision" placeholder="Remisión (opcional)" className={inputClass} />
          <button type="submit" className={`${buttonSecondary} sm:col-span-2 sm:w-fit`}>
            Registrar atención
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Seguimientos" icon={<ClipboardList size={16} />}>
        <div className="flex flex-col gap-3">
          {beneficiario.seguimientos.map((s) => (
            <div key={s.id} className="rounded-lg border-2 border-blue-300 bg-blue-50/50 p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2 text-slate-500">
                <span className="font-medium text-slate-800">{s.avanceNovedad}</span>
                <span>{formatearFecha(s.fecha)}</span>
              </div>
              {s.observacion && <p className="mt-1 text-slate-700">{s.observacion}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {s.accionPendiente ? (
                  <Badge tone="amber">
                    Pendiente: {s.accionPendiente}
                    {s.proximoContacto ? ` · Próximo contacto: ${formatearFecha(s.proximoContacto)}` : ""}
                  </Badge>
                ) : (
                  <Badge tone="emerald">Sin acciones pendientes</Badge>
                )}
              </p>
            </div>
          ))}
        </div>
        {beneficiario.seguimientos.length === 0 && <EmptyState>Sin seguimientos registrados.</EmptyState>}
        <form action={registrarSeguimiento} className="mt-4 grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="beneficiarioId" value={beneficiario.id} />
          <input
            name="avanceNovedad"
            placeholder="Avance o novedad"
            required
            className={`${inputClass} sm:col-span-2`}
          />
          <input type="date" name="fecha" className={inputClass} />
          <input name="observacion" placeholder="Observación (opcional)" className={inputClass} />
          <input name="accionPendiente" placeholder="Acción pendiente (opcional)" className={inputClass} />
          <input type="date" name="proximoContacto" className={inputClass} />
          <button type="submit" className={`${buttonSecondary} sm:col-span-2 sm:w-fit`}>
            Añadir seguimiento
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
