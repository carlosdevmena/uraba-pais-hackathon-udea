import Link from "next/link";
import { Users, HeartHandshake, ClipboardList, Filter, MapPin, X, ShieldCheck, Download } from "lucide-react";
import { Badge, card, inputClass } from "@/components/ui";
import GraficoIngresosBeneficiarios from "@/components/GraficoIngresosBeneficiarios";
import {
  obtenerDatosReporte,
  obtenerSerieTemporal,
  RANGOS_TEMPORALES,
  type FiltrosReporte,
  type RangoTemporal,
} from "@/lib/reportes";

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

  const rangos = Object.keys(RANGOS_TEMPORALES) as RangoTemporal[];
  const [datos, ...seriesPorRango] = await Promise.all([
    obtenerDatosReporte(filtros),
    ...rangos.map((r) => obtenerSerieTemporal(r)),
  ]);
  const series = Object.fromEntries(rangos.map((r, i) => [r, seriesPorRango[i]])) as Record<
    RangoTemporal,
    Awaited<ReturnType<typeof obtenerSerieTemporal>>
  >;

  const queryExport = new URLSearchParams(
    Object.entries(filtros).filter((entry): entry is [string, string] => Boolean(entry[1]))
  ).toString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reportes e indicadores</h1>
          <p className="mt-1 text-sm text-slate-500">
            Datos agregados, calculados en tiempo real a partir de la información registrada.
            No se muestran nombres ni documentos.
          </p>
        </div>
        <Link
          href={`/reportes/export${queryExport ? `?${queryExport}` : ""}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800"
        >
          <Download size={15} />
          Descargar reporte (CSV)
        </Link>
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
              {datos.programas.map((p) => (
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
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
          >
            <Filter size={14} />
            Aplicar filtros
          </button>
          {hayFiltrosActivos && (
            <Link
              href="/reportes"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <X size={14} />
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {hayFiltrosActivos && datos.beneficiariosUnicos === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400">
          Ningún beneficiario coincide con estos filtros.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaIndicador titulo="Beneficiarios únicos" valor={datos.beneficiariosUnicos} icon={Users} />
        <TarjetaIndicador
          titulo="Atenciones o ayudas registradas"
          valor={datos.atencionesRegistradas}
          icon={HeartHandshake}
        />
        <TarjetaIndicador
          titulo="Seguimientos con acción pendiente"
          valor={datos.seguimientosPendientes}
          icon={ClipboardList}
        />
      </div>

      <GraficoIngresosBeneficiarios series={series} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TablaDistribucion
          titulo="Participaciones por programa"
          filas={datos.participacionesPorPrograma.map((p) => ({
            etiqueta: datos.nombrePrograma.get(p.programaId) ?? "Programa",
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Participaciones por estado"
          filas={datos.participacionesPorEstado.map((p) => ({
            etiqueta: ETIQUETAS_ESTADO[p.estado] ?? p.estado,
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Beneficiarios por tipo de población"
          filas={datos.beneficiariosPorPoblacion.map((p) => ({
            etiqueta: ETIQUETAS_POBLACION[p.tipoPoblacion] ?? p.tipoPoblacion,
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Beneficiarios por municipio"
          filas={datos.beneficiariosPorMunicipio.map((p) => ({
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
            { label: "Beneficiarios únicos", valor: datos.beneficiariosUnicos },
            { label: "Eventos totales registrados", valor: datos.eventosTotales },
            { label: "Eventos por beneficiario (prom.)", valor: datos.promedioEventos.toFixed(1) },
            { label: "Fichas con múltiples eventos", valor: datos.fichasConsolidadas.length },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{m.valor}</p>
            </div>
          ))}
        </div>

        {datos.fichasConsolidadas.length > 0 ? (
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
                {datos.fichasConsolidadas.map((b) => (
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
