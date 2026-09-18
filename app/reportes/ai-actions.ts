"use server";

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

export type IndicadoresAgregados = {
  beneficiariosUnicos: number;
  atencionesRegistradas: number;
  participacionesTotal: number;
  seguimientosPendientes: number;
  porMunicipio: { municipio: string; total: number }[];
  porPoblacion: { tipoPoblacion: string; total: number }[];
  porEstadoParticipacion: { estado: string; total: number }[];
};

/**
 * Agregados en Postgres (nunca nombres, documento ni teléfono) para
 * alimentar al asistente de IA. Función separada de `analizarIndicadoresIA`
 * para poder probar "cero PII" sin invocar la API real de Anthropic.
 */
export async function obtenerIndicadoresAgregados(): Promise<IndicadoresAgregados> {
  const [
    beneficiariosUnicos,
    atencionesRegistradas,
    participacionesTotal,
    seguimientosPendientes,
    porMunicipioRaw,
    porPoblacionRaw,
    porEstadoRaw,
  ] = await Promise.all([
    prisma.beneficiario.count(),
    prisma.atencion.count(),
    prisma.participacion.count(),
    prisma.seguimiento.count({ where: { accionPendiente: { not: null } } }),
    prisma.beneficiario.groupBy({ by: ["municipio"], _count: { _all: true } }),
    prisma.beneficiario.groupBy({ by: ["tipoPoblacion"], _count: { _all: true } }),
    prisma.participacion.groupBy({ by: ["estado"], _count: { _all: true } }),
  ]);

  return {
    beneficiariosUnicos,
    atencionesRegistradas,
    participacionesTotal,
    seguimientosPendientes,
    porMunicipio: porMunicipioRaw.map((m) => ({
      municipio: m.municipio ?? "Sin municipio",
      total: m._count._all,
    })),
    porPoblacion: porPoblacionRaw.map((p) => ({
      tipoPoblacion: p.tipoPoblacion,
      total: p._count._all,
    })),
    porEstadoParticipacion: porEstadoRaw.map((e) => ({
      estado: e.estado,
      total: e._count._all,
    })),
  };
}

const SYSTEM_PROMPT = `Eres el asistente de IA de reportes del sistema URABÁ-PAÍS (COOPI, FADV, HIAS, HI).
Respondes únicamente a partir de los indicadores agregados que se te entregan (conteos y
porcentajes). Nunca tienes acceso a nombres, documentos ni teléfonos de beneficiarios, y no
debes inventarlos ni pedirlos.

Límites obligatorios (guía oficial del proyecto):
- No reveles información personal ni sensible.
- No emitas diagnósticos médicos, psicológicos o jurídicos.
- No decidas quién recibe una ayuda o servicio.
- Presenta tus respuestas como apoyo para la consulta, nunca como una decisión institucional.

Responde en español, en un párrafo breve y claro, citando las cifras relevantes de los datos
entregados.`;

export async function analizarIndicadoresIA(
  consulta: string
): Promise<{ respuesta?: string; error?: string }> {
  const pregunta = consulta.trim();
  if (!pregunta) return { error: "Escribe una pregunta sobre los indicadores." };
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "El asistente de IA no está configurado (falta ANTHROPIC_API_KEY)." };
  }

  const indicadores = await obtenerIndicadoresAgregados();

  try {
    const client = new Anthropic({
      defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
        ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
        : undefined,
    });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Datos agregados actuales (JSON, sin datos personales):\n${JSON.stringify(indicadores, null, 2)}\n\nPregunta: ${pregunta}`,
        },
      ],
    });

    const texto = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return { respuesta: texto || "El asistente no generó una respuesta de texto." };
  } catch (e) {
    console.error("analizarIndicadoresIA:", e);
    return { error: "No se pudo consultar el asistente de IA en este momento." };
  }
}
