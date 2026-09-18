"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { card } from "@/components/ui";
import { RANGOS_TEMPORALES, type PuntoSerie, type RangoTemporal } from "@/lib/reportes";

const ANCHO = 640;
const ALTO = 220;
const MARGEN = { top: 16, right: 12, bottom: 28, left: 32 };

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
  const datos = series[rango];
  const anchoUtil = ANCHO - MARGEN.left - MARGEN.right;
  const altoUtil = ALTO - MARGEN.top - MARGEN.bottom;
  const max = Math.max(1, ...datos.map((d) => Math.max(d.registros, d.atenciones)));

  const puntosRegistros = construirPuntos(
    datos.map((d) => d.registros),
    max,
    anchoUtil,
    altoUtil
  );
  const puntosAtenciones = construirPuntos(
    datos.map((d) => d.atenciones),
    max,
    anchoUtil,
    altoUtil
  );

  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <TrendingUp size={16} className="text-brand-700" />
          Registros y atenciones en el tiempo
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-100/70 p-1 text-xs font-medium">
          {(Object.keys(RANGOS_TEMPORALES) as RangoTemporal[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRango(r)}
              className={`rounded-full px-3 py-1 transition ${
                rango === r ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {RANGOS_TEMPORALES[r].etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-600" /> Beneficiarios registrados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-400" /> Atenciones
        </span>
      </div>

      {datos.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">Sin datos en este período aún.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            role="img"
            aria-label={`Curva de registros y atenciones — ${RANGOS_TEMPORALES[rango].etiqueta}`}
            className="mt-3 h-auto w-full"
          >
            <line
              x1={MARGEN.left}
              y1={MARGEN.top + altoUtil}
              x2={MARGEN.left + anchoUtil}
              y2={MARGEN.top + altoUtil}
              className="stroke-slate-200"
              strokeWidth={1}
            />
            <polyline points={puntosRegistros} fill="none" className="stroke-brand-600" strokeWidth={2} />
            <polyline points={puntosAtenciones} fill="none" className="stroke-accent-400" strokeWidth={2} />
            {datos.map((d, i) => {
              const pasoX = datos.length > 1 ? anchoUtil / (datos.length - 1) : 0;
              const x = MARGEN.left + i * pasoX;
              if (i % Math.ceil(datos.length / 8 || 1) !== 0) return null;
              return (
                <text key={d.periodo} x={x} y={ALTO - 6} textAnchor="middle" className="fill-slate-400 text-[9px]">
                  {d.periodo}
                </text>
              );
            })}
          </svg>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs">
              <caption className="sr-only">Datos del gráfico de registros y atenciones por período</caption>
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-1 pr-3 font-medium">Período</th>
                  <th className="py-1 pr-3 font-medium">Registros</th>
                  <th className="py-1 pr-3 font-medium">Atenciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {datos.map((d) => (
                  <tr key={d.periodo}>
                    <td className="py-1 pr-3">{d.periodo}</td>
                    <td className="py-1 pr-3">{d.registros}</td>
                    <td className="py-1 pr-3">{d.atenciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
