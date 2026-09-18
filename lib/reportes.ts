import { Prisma, TipoPoblacion } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FiltrosReporte = {
  municipio?: string;
  poblacion?: string;
  programa?: string;
  desde?: string;
  hasta?: string;
};

export function construirFiltroBeneficiario(filtros: FiltrosReporte): Prisma.BeneficiarioWhereInput {
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
export function construirFiltroSql(filtros: FiltrosReporte): Prisma.Sql {
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

export async function obtenerDatosReporte(filtros: FiltrosReporte) {
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
  const eventosTotales = participacionesTotal + atencionesRegistradas + seguimientosTotal;
  const promedioEventos = beneficiariosUnicos > 0 ? eventosTotales / beneficiariosUnicos : 0;
  const fichasConsolidadas = fichasConsolidadasRaw.map((f) => ({
    codigoInterno: f.codigoInterno,
    totalEventos: Number(f.totalEventos),
    lineas: f.lineas ?? [],
  }));

  return {
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
    nombrePrograma,
    eventosTotales,
    promedioEventos,
    fichasConsolidadas,
  };
}

export const RANGOS_TEMPORALES = {
  "7d": { etiqueta: "Última semana", dias: 7, unidad: "day" as const },
  "3m": { etiqueta: "Últimos 3 meses", dias: 90, unidad: "week" as const },
  "6m": { etiqueta: "Últimos 6 meses", dias: 180, unidad: "week" as const },
  "1y": { etiqueta: "Último año", dias: 365, unidad: "month" as const },
};
export type RangoTemporal = keyof typeof RANGOS_TEMPORALES;

export type PuntoSerie = { periodo: string; registros: number; atenciones: number };

function formatearPeriodo(fecha: Date, unidad: "day" | "week" | "month"): string {
  if (unidad === "month") return new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit" }).format(fecha);
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(fecha);
}

/**
 * Series independientes (registros de beneficiarios por fecha de creación,
 * atenciones por fecha propia) agregadas en Postgres con date_trunc y
 * fusionadas por período — nunca se cargan las filas completas a JS.
 */
export async function obtenerSerieTemporal(rango: RangoTemporal): Promise<PuntoSerie[]> {
  const { dias, unidad } = RANGOS_TEMPORALES[rango];
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const [registrosRaw, atencionesRaw] = await Promise.all([
    prisma.$queryRaw<{ periodo: Date; total: bigint }[]>`
      SELECT date_trunc(${unidad}, "createdAt") AS periodo, COUNT(*)::bigint AS total
      FROM "Beneficiario"
      WHERE "createdAt" >= ${desde}
      GROUP BY periodo
      ORDER BY periodo ASC
    `,
    prisma.$queryRaw<{ periodo: Date; total: bigint }[]>`
      SELECT date_trunc(${unidad}, "fecha") AS periodo, COUNT(*)::bigint AS total
      FROM "Atencion"
      WHERE "fecha" >= ${desde}
      GROUP BY periodo
      ORDER BY periodo ASC
    `,
  ]);

  const mapa = new Map<number, { registros: number; atenciones: number; fecha: Date }>();
  for (const r of registrosRaw) {
    mapa.set(r.periodo.getTime(), { registros: Number(r.total), atenciones: 0, fecha: r.periodo });
  }
  for (const a of atencionesRaw) {
    const clave = a.periodo.getTime();
    const existente = mapa.get(clave);
    if (existente) existente.atenciones = Number(a.total);
    else mapa.set(clave, { registros: 0, atenciones: Number(a.total), fecha: a.periodo });
  }

  return [...mapa.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => ({
      periodo: formatearPeriodo(v.fecha, unidad),
      registros: v.registros,
      atenciones: v.atenciones,
    }));
}
