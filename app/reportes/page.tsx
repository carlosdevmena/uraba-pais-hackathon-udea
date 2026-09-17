import Link from "next/link";
import { Prisma, TipoPoblacion } from "@prisma/client";
import { Users, HeartHandshake, ClipboardList, Filter, MapPin, X, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, card, inputClass } from "@/components/ui";

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

const MUNICIPIOS = ["Apartadó", "Turbo", "Necoclí", "Otro"];

type FiltrosReporte = {
  municipio?: string;
  poblacion?: string;
  programa?: string;
  desde?: string;
  hasta?: string;
};

function construirFiltroBeneficiario(filtros: FiltrosReporte): Prisma.BeneficiarioWhereInput {
  const where: Prisma.BeneficiarioWhereInput = {};
  if (filtros.municipio) where.municipio = filtros.municipio;
  if (filtros.poblacion && Object.values(TipoPoblacion).includes(filtros.poblacion as TipoPoblacion)) {
    where.tipoPoblacion = filtros.poblacion as TipoPoblacion;
  }
  if (filtros.programa) where.participaciones = { some: { programaId: filtros.programa } };
  if (filtros.desde || filtros.hasta) {
    where.createdAt = {};
    if (filtros.desde) where.createdAt.gte = new Date(filtros.desde);
    if (filtros.hasta) {
      const hasta = new Date(filtros.hasta);
      hasta.setHours(23, 59, 59, 999);
      where.createdAt.lte = hasta;
    }
  }
  return where;
}

// Mismo filtro que construirFiltroBeneficiario, como fragmento SQL — usado por
// la auditoría de consolidación, que agrega por persona a través de 3 tablas
// (algo que un groupBy de Prisma sobre un solo modelo no puede expresar).
// Se calcula siempre en Postgres, nunca cargando beneficiarios a un arreglo
// de JavaScript, para escalar de forma segura a los 11k-30k registros
// proyectados (ISO/IEC 25010 — eficiencia de desempeño).
function construirFiltroSql(filtros: FiltrosReporte): Prisma.Sql {
  const condiciones: Prisma.Sql[] = [];
  if (filtros.municipio) condiciones.push(Prisma.sql`b.municipio = ${filtros.municipio}`);
  if (filtros.poblacion && Object.values(TipoPoblacion).includes(filtros.poblacion as TipoPoblacion)) {
    condiciones.push(Prisma.sql`b."tipoPoblacion" = ${filtros.poblacion}::"TipoPoblacion"`);
  }
  if (filtros.programa) {
    condiciones.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "Participacion" pp WHERE pp."beneficiarioId" = b.id AND pp."programaId" = ${filtros.programa})`
    );
  }
  if (filtros.desde) condiciones.push(Prisma.sql`b."createdAt" >= ${new Date(filtros.desde)}`);
  if (filtros.hasta) {
    const hasta = new Date(filtros.hasta);
    hasta.setHours(23, 59, 59, 999);
    condiciones.push(Prisma.sql`b."createdAt" <= ${hasta}`);
  }
  return condiciones.length > 0 ? Prisma.sql`WHERE ${Prisma.join(condiciones, " AND ")}` : Prisma.empty;
}

function TarjetaIndicador({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string;
  valor: number | string;
  icon: typeof Users;
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center gap-2 text-slate-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon size={16} />
        </span>
        <p className="text-sm">{titulo}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{valor}</p>
    </div>
  );
}

function TablaDistribucion({
  titulo,
  filas,
}: {
  titulo: string;
  filas: { etiqueta: string; valor: number }[];
}) {
  const total = filas.reduce((acc, f) => acc + f.valor, 0) || 1;
  return (
    <div className={`${card} p-5`}>
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex items-center gap-2 text-sm sm:gap-3">
            <span className="w-20 shrink-0 truncate text-slate-600 sm:w-40" title={f.etiqueta}>
              {f.etiqueta}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${(f.valor / total) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-medium text-slate-900">{f.valor}</span>
          </div>
        ))}
        {filas.length === 0 && <p className="text-sm text-slate-400">Sin datos aún.</p>}
      </div>
    </div>
  );
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<FiltrosReporte>;
}) {
  const filtrosCrudos = await searchParams;
  const filtros: FiltrosReporte = {
    municipio: filtrosCrudos.municipio || undefined,
    poblacion: filtrosCrudos.poblacion || undefined,
    programa: filtrosCrudos.programa || undefined,
    desde: filtrosCrudos.desde || undefined,
    hasta: filtrosCrudos.hasta || undefined,
  };
  const hayFiltrosActivos = Object.values(filtros).some(Boolean);
  const filtroBeneficiario = construirFiltroBeneficiario(filtros);

  const filtroSql = construirFiltroSql(filtros);

  const [
    beneficiariosUnicos,
    atencionesRegistradas,
    participacionesTotal,
    seguimientosTotal,
    seguimientosPendientes,
    participacionesPorPrograma,
    participacionesPorEstado,
    beneficiariosPorPoblacion,
    beneficiariosPorMunicipio,
    programas,
    fichasConsolidadasRaw,
  ] = await Promise.all([
    prisma.beneficiario.count({ where: filtroBeneficiario }),
    prisma.atencion.count({ where: { beneficiario: filtroBeneficiario } }),
    prisma.participacion.count({ where: { beneficiario: filtroBeneficiario } }),
    prisma.seguimiento.count({ where: { beneficiario: filtroBeneficiario } }),
    prisma.seguimiento.count({
      where: { accionPendiente: { not: null }, beneficiario: filtroBeneficiario },
    }),
    prisma.participacion.groupBy({
      by: ["programaId"],
      where: { beneficiario: filtroBeneficiario },
      _count: { _all: true },
    }),
    prisma.participacion.groupBy({
      by: ["estado"],
      where: { beneficiario: filtroBeneficiario },
      _count: { _all: true },
    }),
    prisma.beneficiario.groupBy({
      by: ["tipoPoblacion"],
      where: filtroBeneficiario,
      _count: { _all: true },
    }),
    prisma.beneficiario.groupBy({
      by: ["municipio"],
      where: filtroBeneficiario,
      _count: { _all: true },
    }),
    prisma.programa.findMany(),
    // Agregado directamente en Postgres (GROUP BY sobre las 3 tablas de eventos),
    // acotado con LIMIT — nunca carga los beneficiarios completos a JavaScript.
    prisma.$queryRaw<{ codigoInterno: string; totalEventos: bigint; lineas: string[] | null }[]>`
      SELECT b."codigoInterno" AS "codigoInterno",
             COUNT(e.*)::int AS "totalEventos",
             ARRAY(
               SELECT DISTINCT pr."lineaTrabajo"::text
               FROM "Participacion" pp2
               JOIN "Programa" pr ON pr.id = pp2."programaId"
               WHERE pp2."beneficiarioId" = b.id
             ) AS lineas
      FROM "Beneficiario" b
      JOIN (
        SELECT "beneficiarioId" FROM "Participacion"
        UNION ALL
        SELECT "beneficiarioId" FROM "Atencion"
        UNION ALL
        SELECT "beneficiarioId" FROM "Seguimiento"
      ) e ON e."beneficiarioId" = b.id
      ${filtroSql}
      GROUP BY b.id, b."codigoInterno"
      HAVING COUNT(e.*) > 1
      ORDER BY "totalEventos" DESC
      LIMIT 10
    `,
  ]);

  const nombrePrograma = new Map(programas.map((p) => [p.id, p.nombre]));

  // Auditoría de deduplicación: eventos reales (participaciones + atenciones +
  // seguimientos) frente a personas únicas, con cifras reales de esta base
  // (no una cifra de referencia externa) — evidencia del principio de ficha única.
  const eventosTotales = participacionesTotal + atencionesRegistradas + seguimientosTotal;
  const promedioEventos = beneficiariosUnicos > 0 ? eventosTotales / beneficiariosUnicos : 0;
  const fichasConsolidadas = fichasConsolidadasRaw.map((f) => ({
    codigoInterno: f.codigoInterno,
    totalEventos: Number(f.totalEventos),
    lineas: f.lineas ?? [],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reportes e indicadores</h1>
        <p className="mt-1 text-sm text-slate-500">
          Datos agregados, calculados en tiempo real a partir de la información registrada.
          No se muestran nombres ni documentos.
        </p>
      </div>

      <form className={`${card} flex flex-col gap-3 p-4`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter size={15} className="text-brand-700" />
          Filtros
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Municipio</span>
            <select name="municipio" defaultValue={filtros.municipio ?? ""} className={inputClass}>
              <option value="">Todos</option>
              {MUNICIPIOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Tipo de población</span>
            <select name="poblacion" defaultValue={filtros.poblacion ?? ""} className={inputClass}>
              <option value="">Todas</option>
              {Object.entries(ETIQUETAS_POBLACION).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Programa</span>
            <select name="programa" defaultValue={filtros.programa ?? ""} className={inputClass}>
              <option value="">Todos</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Registrado desde</span>
            <input type="date" name="desde" defaultValue={filtros.desde ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600">Registrado hasta</span>
            <input type="date" name="hasta" defaultValue={filtros.hasta ?? ""} className={inputClass} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
            <Filter size={14} />
            Aplicar filtros
          </button>
          {hayFiltrosActivos && (
            <Link href="/reportes" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
              <X size={14} />
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {hayFiltrosActivos && beneficiariosUnicos === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400">
          Ningún beneficiario coincide con estos filtros.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaIndicador titulo="Beneficiarios únicos" valor={beneficiariosUnicos} icon={Users} />
        <TarjetaIndicador
          titulo="Atenciones o ayudas registradas"
          valor={atencionesRegistradas}
          icon={HeartHandshake}
        />
        <TarjetaIndicador
          titulo="Seguimientos con acción pendiente"
          valor={seguimientosPendientes}
          icon={ClipboardList}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TablaDistribucion
          titulo="Participaciones por programa"
          filas={participacionesPorPrograma.map((p) => ({
            etiqueta: nombrePrograma.get(p.programaId) ?? "Programa",
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Participaciones por estado"
          filas={participacionesPorEstado.map((p) => ({
            etiqueta: ETIQUETAS_ESTADO[p.estado] ?? p.estado,
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Beneficiarios por tipo de población"
          filas={beneficiariosPorPoblacion.map((p) => ({
            etiqueta: ETIQUETAS_POBLACION[p.tipoPoblacion] ?? p.tipoPoblacion,
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Beneficiarios por municipio"
          filas={beneficiariosPorMunicipio.map((p) => ({
            etiqueta: p.municipio ?? "Sin municipio",
            valor: p._count._all,
          }))}
        />
      </div>
      <div className={`${card} p-5 sm:p-6`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShieldCheck size={16} className="text-brand-700" />
          Auditoría y consolidación de datos
        </div>
        <p className="mt-1 text-sm text-slate-500">
          El sistema aplica el principio de <strong>ficha única por persona</strong>: cada
          beneficiario conserva un solo código interno aunque acumule varias participaciones,
          atenciones o seguimientos. Cifras reales de esta base (no una muestra de referencia):
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Beneficiarios únicos", valor: beneficiariosUnicos },
            { label: "Eventos totales registrados", valor: eventosTotales },
            { label: "Eventos por beneficiario (prom.)", valor: promedioEventos.toFixed(1) },
            { label: "Fichas con múltiples eventos", valor: fichasConsolidadas.length },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{m.valor}</p>
            </div>
          ))}
        </div>

        {fichasConsolidadas.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Código interno</th>
                  <th className="py-2 pr-4">Eventos vinculados</th>
                  <th className="py-2 pr-4">Líneas de trabajo</th>
                  <th className="py-2 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fichasConsolidadas.map((b) => (
                  <tr key={b.codigoInterno}>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-600">{b.codigoInterno}</td>
                    <td className="py-2 pr-4 text-slate-800">{b.totalEventos}</td>
                    <td className="py-2 pr-4 text-slate-600">
                      {b.lineas.length > 0 ? b.lineas.join(", ") : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge tone="emerald">Ficha única consolidada</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Ningún beneficiario tiene todavía más de un evento registrado.
          </p>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <MapPin size={12} />
        Territorio del proyecto: Apartadó, Turbo y Necoclí (Urabá antioqueño).
      </p>
    </div>
  );
}
