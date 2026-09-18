import * as XLSX from "xlsx";
import type { NextRequest } from "next/server";
import { construirFiltroBeneficiario, obtenerDatosReporte, type FiltrosReporte } from "@/lib/reportes";

function celdaCsv(valor: string | number): string {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function filaCsv(valores: (string | number)[]): string {
  return valores.map(celdaCsv).join(",") + "\r\n";
}

/**
 * Filas agregadas (nunca beneficiarios individuales) compartidas entre el
 * export a CSV y a Excel — respeta "sin datos personales en reportes ni
 * pantallas públicas".
 */
function construirFilas(datos: Awaited<ReturnType<typeof obtenerDatosReporte>>): (string | number)[][] {
  const filas: (string | number)[][] = [];
  filas.push(["Reporte URABÁ-PAÍS — indicadores agregados"]);
  filas.push(["Generado", new Date().toISOString()]);
  filas.push([]);

  filas.push(["Indicador", "Valor"]);
  filas.push(["Beneficiarios únicos", datos.beneficiariosUnicos]);
  filas.push(["Atenciones o ayudas registradas", datos.atencionesRegistradas]);
  filas.push(["Participaciones totales", datos.participacionesTotal]);
  filas.push(["Seguimientos totales", datos.seguimientosTotal]);
  filas.push(["Seguimientos con acción pendiente", datos.seguimientosPendientes]);
  filas.push(["Eventos totales", datos.eventosTotales]);
  filas.push(["Eventos por beneficiario (promedio)", Number(datos.promedioEventos.toFixed(2))]);
  filas.push([]);

  filas.push(["Participaciones por programa"]);
  filas.push(["Programa", "Total"]);
  for (const p of datos.participacionesPorPrograma) {
    filas.push([datos.nombrePrograma.get(p.programaId) ?? "Programa", p._count._all]);
  }
  filas.push([]);

  filas.push(["Participaciones por estado"]);
  filas.push(["Estado", "Total"]);
  for (const p of datos.participacionesPorEstado) {
    filas.push([p.estado, p._count._all]);
  }
  filas.push([]);

  filas.push(["Beneficiarios por tipo de población"]);
  filas.push(["Tipo de población", "Total"]);
  for (const p of datos.beneficiariosPorPoblacion) {
    filas.push([p.tipoPoblacion, p._count._all]);
  }
  filas.push([]);

  filas.push(["Beneficiarios por municipio"]);
  filas.push(["Municipio", "Total"]);
  for (const p of datos.beneficiariosPorMunicipio) {
    filas.push([p.municipio ?? "Sin municipio", p._count._all]);
  }

  return filas;
}

/**
 * Exporta únicamente los indicadores AGREGADOS ya visibles en /reportes
 * (nunca filas de beneficiarios individuales) — respeta la regla de "sin
 * datos personales en reportes ni pantallas públicas" del proyecto.
 * `?formato=csv` (default) o `?formato=xlsx`.
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
  const filas = construirFilas(datos);
  const fechaArchivo = new Date().toISOString().slice(0, 10);
  const formato = params.get("formato") === "xlsx" ? "xlsx" : "csv";

  if (formato === "xlsx") {
    const hoja = XLSX.utils.aoa_to_sheet(filas);
    hoja["!cols"] = [{ wch: 42 }, { wch: 16 }];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Indicadores");
    const buffer = XLSX.write(libro, { type: "buffer", bookType: "xlsx" }) as Buffer;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reporte-urabapais-${fechaArchivo}.xlsx"`,
      },
    });
  }

  let csv = "﻿"; // BOM para que Excel detecte UTF-8
  for (const fila of filas) csv += filaCsv(fila);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte-urabapais-${fechaArchivo}.csv"`,
    },
  });
}
