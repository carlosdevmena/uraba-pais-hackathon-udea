"use client";

import { useMemo, useState } from "react";
import { TrendingUp, BarChart3, LineChart as LineChartIcon, Users, HeartHandshake } from "lucide-react";
import { card } from "@/components/ui";
import { RANGOS_TEMPORALES, type PuntoSerie, type RangoTemporal } from "@/lib/reportes";

const ANCHO = 640;
const ALTO = 240;
const MARGEN = { top: 16, right: 16, bottom: 46, left: 34 };

type Serie = "registros" | "atenciones";
type TipoGrafico = "linea" | "barras";

const SERIES: { valor: Serie; etiqueta: string; icon: typeof Users }[] = [
  { valor: "registros", etiqueta: "Beneficiarios registrados", icon: Users },
  { valor: "atenciones", etiqueta: "Atenciones", icon: HeartHandshake },
];

function formatoDDMM(fecha: Date): string {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit" }).format(fecha);
}

function finDeBucket(inicio: Date, unidad: "day" | "week" | "month"): Date {
  const fin = new Date(inicio);
  if (unidad === "day") return fin;
  if (unidad === "week") {
    fin.setDate(fin.getDate() + 6);
    return fin;
  }
  fin.setMonth(fin.getMonth() + 1);
  fin.setDate(fin.getDate() - 1);
  return fin;
}

function desviacionEstandar(valores: number[]): number {
  if (valores.length === 0) return 0;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((a, b) => a + (b - media) ** 2, 0) / valores.length;
  return Math.sqrt(varianza);
}

function construirPuntos(valores: number[], max: number, ancho: number, alto: number) {
  if (valores.length === 0) return "";
  const pasoX = valores.length > 1 ? ancho / (valores.length - 1) : 0;
  return valores
    .map((v, i) => {
      const x = MARGEN.left + i * pasoX;
      const y = MARGEN.top + (alto - (max > 0 ? (v / max) * alto : 0));
      return `${x},${y}`;
    })
    .join(" ");
}

export default function GraficoIngresosBeneficiarios({
  series,
}: {
  series: Record<RangoTemporal, PuntoSerie[]>;
}) {
  const [rango, setRango] = useState<RangoTemporal>("3m");
  const [serie, setSerie] = useState<Serie>("registros");
  const [tipo, setTipo] = useState<TipoGrafico>("linea");

  const datos = series[rango];
  const unidad = RANGOS_TEMPORALES[rango].unidad;
  const anchoUtil = ANCHO - MARGEN.left - MARGEN.right;
  const altoUtil = ALTO - MARGEN.top - MARGEN.bottom;

  const valores = useMemo(() => datos.map((d) => d[serie]), [datos, serie]);
  const max = Math.max(1, ...valores);
  const puntos = construirPuntos(valores, max, anchoUtil, altoUtil);
  const pasoX = valores.length > 1 ? anchoUtil / (valores.length - 1) : 0;

  const ticksY = [0, Math.round(max / 2), max].filter((v, i, arr) => arr.indexOf(v) === i);

  const { rangoTexto, maximo, stdDev } = useMemo(() => {
    const maximo = valores.length > 0 ? Math.max(...valores) : 0;
    const stdDev = desviacionEstandar(valores);
    let rangoTexto = "";
    if (datos.length > 0) {
      const inicio = new Date(datos[0].fechaInicio);
      const fin = finDeBucket(new Date(datos[datos.length - 1].fechaInicio), unidad);
      rangoTexto = `Del ${formatoDDMM(inicio)} al ${formatoDDMM(fin)}`;
    }
    return { rangoTexto, maximo, stdDev };
  }, [valores, datos, unidad]);

  const serieActiva = SERIES.find((s) => s.valor === serie)!;

  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <TrendingUp size={16} className="text-brand-700 dark:text-brand-300" />
          Registros y atenciones en el tiempo
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-slate-200 bg-slate-100/70 p-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800/70">
            <button
              type="button"
              onClick={() => setTipo("linea")}
              aria-label="Ver como línea"
              aria-pressed={tipo === "linea"}
              className={`flex h-6 w-7 items-center justify-center rounded-full transition ${
                tipo === "linea"
                  ? "bg-white text-brand-800 shadow-sm dark:bg-slate-700 dark:text-brand-200"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <LineChartIcon size={13} />
            </button>
            <button
              type="button"
              onClick={() => setTipo("barras")}
              aria-label="Ver como barras"
              aria-pressed={tipo === "barras"}
              className={`flex h-6 w-7 items-center justify-center rounded-full transition ${
                tipo === "barras"
                  ? "bg-white text-brand-800 shadow-sm dark:bg-slate-700 dark:text-brand-200"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <BarChart3 size={13} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-100/70 p-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800/70">
            {(Object.keys(RANGOS_TEMPORALES) as RangoTemporal[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRango(r)}
                className={`rounded-full px-3 py-1 transition ${
                  rango === r
                    ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-brand-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {RANGOS_TEMPORALES[r].etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="absolute right-0 top-0 z-10 flex flex-col gap-1">
          {SERIES.map(({ valor, etiqueta, icon: Icon }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setSerie(valor)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition ${
                serie === valor
                  ? "border-brand-300 bg-brand-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Icon size={13} />
              {etiqueta}
            </button>
          ))}
        </div>

        {datos.length === 0 ? (
          <p className="py-6 text-sm text-slate-400 dark:text-slate-500">Sin datos en este período aún.</p>
        ) : (
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            role="img"
            aria-label={`${serieActiva.etiqueta} — ${RANGOS_TEMPORALES[rango].etiqueta}, ${rangoTexto}`}
            className="mt-10 h-auto w-full sm:mt-3"
          >
            {ticksY.map((v) => {
              const y = MARGEN.top + (altoUtil - (max > 0 ? (v / max) * altoUtil : 0));
              return (
                <g key={v}>
                  <line
                    x1={MARGEN.left}
                    y1={y}
                    x2={MARGEN.left + anchoUtil}
                    y2={y}
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth={1}
                  />
                  <text x={MARGEN.left - 8} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px] dark:fill-slate-500">
                    {v}
                  </text>
                </g>
              );
            })}

            <line
              x1={MARGEN.left}
              y1={MARGEN.top + altoUtil}
              x2={MARGEN.left + anchoUtil}
              y2={MARGEN.top + altoUtil}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth={1}
            />

            {tipo === "linea" ? (
              <>
                <polyline points={puntos} fill="none" className="stroke-brand-600 dark:stroke-brand-400" strokeWidth={2} />
                {valores.map((v, i) => {
                  const x = MARGEN.left + i * pasoX;
                  const y = MARGEN.top + (altoUtil - (max > 0 ? (v / max) * altoUtil : 0));
                  return <circle key={i} cx={x} cy={y} r={2.5} className="fill-brand-600 dark:fill-brand-400" />;
                })}
              </>
            ) : (
              valores.map((v, i) => {
                const anchoBarra = Math.max(4, (pasoX || anchoUtil) * 0.55);
                const x = MARGEN.left + i * pasoX - anchoBarra / 2;
                const alturaBarra = max > 0 ? (v / max) * altoUtil : 0;
                const y = MARGEN.top + (altoUtil - alturaBarra);
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={anchoBarra}
                    height={alturaBarra}
                    rx={2}
                    className="fill-brand-600 dark:fill-brand-400"
                  />
                );
              })
            )}

            {datos.map((d, i) => {
              if (i % Math.ceil(datos.length / 8 || 1) !== 0) return null;
              const x = MARGEN.left + i * pasoX;
              return (
                <text
                  key={d.periodo + i}
                  x={x}
                  y={ALTO - 26}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] dark:fill-slate-500"
                >
                  {d.periodo}
                </text>
              );
            })}

            {/* Línea/corchete que marca el rango real de fechas cubierto. */}
            <g className="stroke-slate-300 dark:stroke-slate-600">
              <line x1={MARGEN.left} y1={ALTO - 16} x2={MARGEN.left + anchoUtil} y2={ALTO - 16} strokeWidth={1} />
              <line x1={MARGEN.left} y1={ALTO - 19} x2={MARGEN.left} y2={ALTO - 13} strokeWidth={1} />
              <line
                x1={MARGEN.left + anchoUtil}
                y1={ALTO - 19}
                x2={MARGEN.left + anchoUtil}
                y2={ALTO - 13}
                strokeWidth={1}
              />
            </g>
            <text x={MARGEN.left} y={ALTO - 4} textAnchor="start" className="fill-slate-500 text-[9px] font-medium dark:fill-slate-400">
              {datos.length > 0 ? formatoDDMM(new Date(datos[0].fechaInicio)) : ""}
            </text>
            <text
              x={MARGEN.left + anchoUtil}
              y={ALTO - 4}
              textAnchor="end"
              className="fill-slate-500 text-[9px] font-medium dark:fill-slate-400"
            >
              {datos.length > 0 ? formatoDDMM(finDeBucket(new Date(datos[datos.length - 1].fechaInicio), unidad)) : ""}
            </text>
          </svg>
        )}
      </div>

      {datos.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{rangoTexto}</span>
          <span className="flex flex-wrap gap-x-4">
            <span>
              Máximo: <strong className="font-semibold text-slate-800 dark:text-slate-200">{maximo}</strong>
            </span>
            <span>
              Desviación estándar:{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{stdDev.toFixed(1)}</strong>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
