import type { NextRequest } from "next/server";
import { construirFiltroBeneficiario, obtenerDatosReporte, type FiltrosReporte } from "@/lib/reportes";

function celda(valor: string | number): string {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function fila(valores: (string | number)[]): string {
  return valores.map(celda).join(",") + "\r\n";
}

/**
 * Exporta únicamente los indicadores AGREGADOS ya visibles en /reportes
 * (nunca filas de beneficiarios individuales) — respeta la regla de "sin
 * datos personales en reportes ni pantallas públicas" del proyecto.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filtros: FiltrosReporte = {
    municipio: params.get("municipio") ?? undefined,
    poblacion: params.get("poblacion") ?? undefined,
    programa: params.get("programa") ?? undefined,
    desde: params.get("desde") ?? undefined,
    hasta: params.get("hasta") ?? undefined,
  };
  // Valida que el filtro sea consultable (mismo criterio que la página) antes
  // de calcular los agregados.
  construirFiltroBeneficiario(filtros);

  const datos = await obtenerDatosReporte(filtros);

  let csv = "﻿"; // BOM para que Excel detecte UTF-8
  csv += fila(["Reporte URABÁ-PAÍS — indicadores agregados"]);
  csv += fila(["Generado", new Date().toISOString()]);
  csv += "\r\n";

  csv += fila(["Indicador", "Valor"]);
  csv += fila(["Beneficiarios únicos", datos.beneficiariosUnicos]);
  csv += fila(["Atenciones o ayudas registradas", datos.atencionesRegistradas]);
  csv += fila(["Participaciones totales", datos.participacionesTotal]);
  csv += fila(["Seguimientos totales", datos.seguimientosTotal]);
  csv += fila(["Seguimientos con acción pendiente", datos.seguimientosPendientes]);
  csv += fila(["Eventos totales", datos.eventosTotales]);
  csv += fila(["Eventos por beneficiario (promedio)", datos.promedioEventos.toFixed(2)]);
  csv += "\r\n";

  csv += fila(["Participaciones por programa"]);
  csv += fila(["Programa", "Total"]);
  for (const p of datos.participacionesPorPrograma) {
    csv += fila([datos.nombrePrograma.get(p.programaId) ?? "Programa", p._count._all]);
  }
  csv += "\r\n";

  csv += fila(["Participaciones por estado"]);
  csv += fila(["Estado", "Total"]);
  for (const p of datos.participacionesPorEstado) {
    csv += fila([p.estado, p._count._all]);
  }
  csv += "\r\n";

  csv += fila(["Beneficiarios por tipo de población"]);
  csv += fila(["Tipo de población", "Total"]);
  for (const p of datos.beneficiariosPorPoblacion) {
    csv += fila([p.tipoPoblacion, p._count._all]);
  }
  csv += "\r\n";

  csv += fila(["Beneficiarios por municipio"]);
  csv += fila(["Municipio", "Total"]);
  for (const p of datos.beneficiariosPorMunicipio) {
    csv += fila([p.municipio ?? "Sin municipio", p._count._all]);
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-urabapais-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
