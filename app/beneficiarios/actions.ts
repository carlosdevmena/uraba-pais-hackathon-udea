"use server";

import { prisma } from "@/lib/prisma";
import { EstadoParticipacion, Prisma, TipoPoblacion } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CoincidenciaDifusa = {
  id: string;
  codigoInterno: string;
  nombres: string;
  municipio: string | null;
  score: number;
};

export type ToastAviso = {
  tipo: "error" | "warning";
  mensaje: string;
  duplicadoId?: string;
};

export type ActionState = {
  error?: string;
  duplicadoId?: string;
  participacionEditarHref?: string;
  coincidenciasDifusas?: CoincidenciaDifusa[];
  fieldErrors?: Record<string, string>;
  toast?: ToastAviso;
};

const UMBRAL_COINCIDENCIA_DIFUSA = 0.4;

/**
 * Búsqueda difusa por nombres usando la extensión pg_trgm de Postgres
 * (similitud de trigramas con índice GIN, ver prisma/sql/busqueda_difusa_trigramas.sql).
 * Pensada para personas SIN documento, donde no existe una llave exacta de
 * deduplicación: la guía oficial permite "advertir posibles coincidencias
 * mediante nombres" dejando la decisión final a una persona autorizada.
 */
export async function buscarCoincidenciasDifusas(
  nombres: string,
  opciones: { limit?: number; threshold?: number; excluirId?: string } = {}
): Promise<CoincidenciaDifusa[]> {
  const { limit = 5, threshold = UMBRAL_COINCIDENCIA_DIFUSA, excluirId } = opciones;
  const texto = nombres.trim();
  if (texto.length < 3) return [];

  const resultados = await prisma.$queryRaw<CoincidenciaDifusa[]>`
    SELECT id, "codigoInterno" AS "codigoInterno", nombres, municipio,
           similarity(nombres, ${texto}) AS score
    FROM "Beneficiario"
    WHERE similarity(nombres, ${texto}) > ${threshold}
      AND (${excluirId ?? null}::text IS NULL OR id != ${excluirId ?? null})
    ORDER BY score DESC
    LIMIT ${limit}
  `;
  return resultados;
}

const NOMBRE_PATTERN = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü'\-\s]{2,100}$/;
const DOCUMENTO_PATTERN = /^[A-Za-z0-9\-]{4,15}$/;
const TELEFONO_PATTERN = /^\+?[0-9]{7,15}$/;

function parseFecha(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const fecha = new Date(raw);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function esFechaFutura(fecha: Date): boolean {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return fecha.getTime() > hoy.getTime();
}

function edadEnAnios(fecha: Date): number {
  return (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

async function generarCodigoInterno(): Promise<string> {
  const total = await prisma.beneficiario.count();
  return `BEN-${String(total + 1).padStart(6, "0")}`;
}

export async function buscarBeneficiarios(query: string) {
  const texto = query.trim();
  if (!texto) return [];
  return prisma.beneficiario.findMany({
    where: {
      OR: [
        { nombres: { contains: texto, mode: "insensitive" } },
        { numeroDocumento: { contains: texto } },
        { codigoInterno: { contains: texto, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}

export async function crearBeneficiario(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const nombres = String(formData.get("nombres") ?? "").trim();
  const tipoDocumento = String(formData.get("tipoDocumento") ?? "").trim() || null;
  const numeroDocumento = String(formData.get("numeroDocumento") ?? "").trim() || null;
  const genero = String(formData.get("genero") ?? "").trim() || null;
  const municipio = String(formData.get("municipio") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const tipoPoblacionRaw = String(formData.get("tipoPoblacion") ?? "").trim();
  const discapacidad = formData.get("discapacidad") === "on";
  const tipoDiscapacidad = String(formData.get("tipoDiscapacidad") ?? "").trim() || null;
  const autorizacionDatos = formData.get("autorizacionDatos") === "on";
  const fechaNacimiento = parseFecha(formData.get("fechaNacimiento"));
  const edadRaw = String(formData.get("edadAproximada") ?? "").trim();
  const edadAproximada = edadRaw ? Number(edadRaw) : null;

  const familiarNombres = formData.getAll("familiarNombres").map((v) => String(v).trim());
  const familiarParentescos = formData.getAll("familiarParentescos").map((v) => String(v).trim());

  const fieldErrors: Record<string, string> = {};

  if (!NOMBRE_PATTERN.test(nombres)) {
    fieldErrors.nombres = "Solo letras y espacios, entre 2 y 100 caracteres.";
  }
  if (!autorizacionDatos) {
    fieldErrors.autorizacionDatos = "Debes registrar la autorización para el tratamiento de datos.";
  }
  if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
    fieldErrors.numeroDocumento = "Si registras un documento, indica tanto el tipo como el número.";
  } else if (numeroDocumento && !DOCUMENTO_PATTERN.test(numeroDocumento)) {
    fieldErrors.numeroDocumento = "Debe ser alfanumérico (se permite guion), entre 4 y 15 caracteres.";
  }
  if (telefono && !TELEFONO_PATTERN.test(telefono)) {
    fieldErrors.telefono = "Debe tener entre 7 y 15 dígitos.";
  }
  if (!municipio) {
    fieldErrors.municipio = "El municipio es obligatorio.";
  }
  if (!genero) {
    fieldErrors.genero = 'Selecciona una opción (puede ser "Prefiere no decir").';
  }
  if (!Object.values(TipoPoblacion).includes(tipoPoblacionRaw as TipoPoblacion)) {
    fieldErrors.tipoPoblacion = "Selecciona el tipo de población.";
  }
  if (!fechaNacimiento && !edadAproximada) {
    fieldErrors.fechaNacimiento = "Indica la fecha de nacimiento o una edad aproximada.";
  } else if (fechaNacimiento && (esFechaFutura(fechaNacimiento) || edadEnAnios(fechaNacimiento) > 120)) {
    fieldErrors.fechaNacimiento = "La fecha de nacimiento no es válida.";
  } else if (
    edadAproximada !== null &&
    (!Number.isInteger(edadAproximada) || edadAproximada < 0 || edadAproximada > 120)
  ) {
    fieldErrors.edadAproximada = "Debe ser un número entre 0 y 120.";
  }
  if (discapacidad && !tipoDiscapacidad) {
    fieldErrors.tipoDiscapacidad = "Indica qué tipo de discapacidad tiene la persona.";
  }

  // El núcleo familiar ahora es obligatorio: al menos un integrante con
  // nombre y parentesco (decisión de este cierre de fase).
  const primerFamiliarNombre = familiarNombres[0] ?? "";
  const primerFamiliarParentesco = familiarParentescos[0] ?? "";
  if (!primerFamiliarNombre || !primerFamiliarParentesco) {
    fieldErrors.familiar = "Debe registrar al menos un integrante familiar con nombre y parentesco.";
  } else if (!NOMBRE_PATTERN.test(primerFamiliarNombre)) {
    fieldErrors.familiar = "El nombre del familiar no es válido (solo letras y espacios).";
  }
  for (const nombre of familiarNombres.slice(1)) {
    if (nombre && !NOMBRE_PATTERN.test(nombre)) {
      fieldErrors.familiar = "El nombre de un familiar no es válido (solo letras y espacios).";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (tipoDocumento && numeroDocumento) {
    const existente = await prisma.beneficiario.findFirst({
      where: { tipoDocumento, numeroDocumento },
      select: { id: true, nombres: true, codigoInterno: true },
    });
    if (existente) {
      return {
        toast: {
          tipo: "warning",
          mensaje: `Ya existe una persona registrada con este documento: ${existente.nombres} (${existente.codigoInterno}).`,
          duplicadoId: existente.id,
        },
      };
    }
  }

  // Sin documento no hay llave exacta de deduplicación: se advierte por
  // similitud de nombres (trigramas) y la decisión final queda en manos de
  // la persona autorizada (criterio explícito de la guía oficial).
  const confirmarSinCoincidencia = formData.get("confirmarSinCoincidencia") === "on";
  if (!tipoDocumento && !confirmarSinCoincidencia) {
    const coincidencias = await buscarCoincidenciasDifusas(nombres);
    if (coincidencias.length > 0) {
      return { coincidenciasDifusas: coincidencias };
    }
  }

  const codigoInterno = await generarCodigoInterno();
  const tipoPoblacion = tipoPoblacionRaw as TipoPoblacion;

  const beneficiario = await prisma.beneficiario.create({
    data: {
      codigoInterno,
      nombres,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
      edadAproximada,
      genero,
      municipio,
      telefono,
      tipoPoblacion,
      discapacidad,
      tipoDiscapacidad: discapacidad ? tipoDiscapacidad : null,
      autorizacionDatos,
      fechaAutorizacion: new Date(),
      familiares: {
        create: familiarNombres
          .map((nombre, i) => ({ nombre, parentesco: familiarParentescos[i] ?? "" }))
          .filter((f) => f.nombre)
          .map((f) => ({ nombres: f.nombre, parentesco: f.parentesco || "Familiar" })),
      },
    },
  });

  revalidatePath("/beneficiarios");
  redirect(`/beneficiarios/${beneficiario.id}`);
}

export async function agregarFamiliar(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const nombres = String(formData.get("nombres") ?? "").trim();
  const parentesco = String(formData.get("parentesco") ?? "").trim();
  const fechaNacimiento = parseFecha(formData.get("fechaNacimiento"));

  if (!beneficiarioId) return { error: "Beneficiario inválido." };
  if (!NOMBRE_PATTERN.test(nombres)) {
    return { error: "El nombre del familiar es obligatorio: solo letras y espacios, entre 2 y 100 caracteres." };
  }
  if (!parentesco || parentesco.length < 2) {
    return { error: "Indica el parentesco (ej. hijo/a, cónyuge, madre, padre)." };
  }
  if (fechaNacimiento && (esFechaFutura(fechaNacimiento) || edadEnAnios(fechaNacimiento) > 120)) {
    return { error: "La fecha de nacimiento no es válida." };
  }

  await prisma.familiarIntegrante.create({
    data: { beneficiarioId, nombres, parentesco, fechaNacimiento },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  redirect(`/beneficiarios/${beneficiarioId}`);
}

const ESTADOS_ACTIVOS: EstadoParticipacion[] = [EstadoParticipacion.inscrito, EstadoParticipacion.en_proceso];

export async function vincularPrograma(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const programaId = String(formData.get("programaId") ?? "");
  const estadoRaw = String(formData.get("estado") ?? "inscrito");
  const fechaVinculacion = parseFecha(formData.get("fechaVinculacion")) ?? new Date();

  if (!beneficiarioId) return { error: "Beneficiario inválido." };
  if (!programaId) return { error: "Selecciona un programa." };
  if (esFechaFutura(fechaVinculacion)) {
    return { error: "La fecha de vinculación no puede ser en el futuro." };
  }

  const estado = Object.values(EstadoParticipacion).includes(estadoRaw as EstadoParticipacion)
    ? (estadoRaw as EstadoParticipacion)
    : EstadoParticipacion.inscrito;

  if (ESTADOS_ACTIVOS.includes(estado)) {
    const activaExistente = await prisma.participacion.findFirst({
      where: { beneficiarioId, programaId, estado: { in: ESTADOS_ACTIVOS } },
      include: { programa: true },
    });
    if (activaExistente) {
      return {
        error: `Este beneficiario ya tiene una vinculación activa (${activaExistente.estado}) en "${activaExistente.programa.nombre}". Actualiza esa vinculación en vez de crear otra.`,
        participacionEditarHref: `/beneficiarios/${beneficiarioId}/programas/${activaExistente.id}/editar`,
      };
    }
  }

  // La base de datos también protege contra esta duplicidad con un índice único
  // parcial (prisma/sql/participacion_activa_unica.sql); este catch es la red
  // de seguridad ante condiciones de carrera.
  try {
    await prisma.participacion.create({
      data: { beneficiarioId, programaId, estado, fechaVinculacion },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error: "Este beneficiario ya tiene una vinculación activa en ese programa.",
      };
    }
    throw e;
  }

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  redirect(`/beneficiarios/${beneficiarioId}`);
}

export async function actualizarEstadoParticipacion(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const participacionId = String(formData.get("participacionId") ?? "");
  const beneficiarioId = String(formData.get("beneficiarioId") ?? "");
  const estadoRaw = String(formData.get("estado") ?? "");

  if (!participacionId || !beneficiarioId) return { error: "Vinculación inválida." };
  if (!Object.values(EstadoParticipacion).includes(estadoRaw as EstadoParticipacion)) {
    return { error: "Selecciona un estado válido." };
  }
  const estado = estadoRaw as EstadoParticipacion;

  if (ESTADOS_ACTIVOS.includes(estado)) {
    const participacionActual = await prisma.participacion.findUnique({
      where: { id: participacionId },
      select: { programaId: true },
    });
    if (participacionActual) {
      const otraActiva = await prisma.participacion.findFirst({
        where: {
          beneficiarioId,
          programaId: participacionActual.programaId,
          estado: { in: ESTADOS_ACTIVOS },
          id: { not: participacionId },
        },
      });
      if (otraActiva) {
        return { error: "Ya existe otra vinculación activa de este beneficiario en el mismo programa." };
      }
    }
  }

  await prisma.participacion.update({
    where: { id: participacionId },
    data: { estado },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  redirect(`/beneficiarios/${beneficiarioId}`);
}

export async function registrarAtencion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const tipo = String(formData.get("tipo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const resultado = String(formData.get("resultado") ?? "").trim();
  const remision = String(formData.get("remision") ?? "").trim() || null;
  const fecha = parseFecha(formData.get("fecha")) ?? new Date();

  if (!beneficiarioId) return { error: "Beneficiario inválido." };
  if (tipo.length < 2) return { error: "Indica el tipo de atención o ayuda." };
  if (descripcion.length < 5) return { error: "La descripción debe tener al menos 5 caracteres." };
  if (responsable.length < 2) return { error: "Indica el responsable o la entidad." };
  if (resultado.length < 2) return { error: "Indica el resultado de la atención." };
  if (esFechaFutura(fecha)) return { error: "La fecha de la atención no puede ser en el futuro." };

  await prisma.atencion.create({
    data: { beneficiarioId, tipo, descripcion, responsable, resultado, remision, fecha },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  redirect(`/beneficiarios/${beneficiarioId}`);
}

export async function registrarSeguimiento(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const avanceNovedad = String(formData.get("avanceNovedad") ?? "").trim();
  const observacion = String(formData.get("observacion") ?? "").trim() || null;
  const accionPendiente = String(formData.get("accionPendiente") ?? "").trim() || null;
  const proximoContacto = parseFecha(formData.get("proximoContacto"));
  const fecha = parseFecha(formData.get("fecha")) ?? new Date();

  if (!beneficiarioId) return { error: "Beneficiario inválido." };
  if (avanceNovedad.length < 3) {
    return { error: "Describe el avance o la novedad (mínimo 3 caracteres)." };
  }
  if (esFechaFutura(fecha)) return { error: "La fecha del seguimiento no puede ser en el futuro." };
  if (accionPendiente && !proximoContacto) {
    return { error: "Si hay una acción pendiente, indica la fecha de próximo contacto." };
  }
  if (proximoContacto) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (proximoContacto.getTime() < hoy.getTime()) {
      return { error: "El próximo contacto debe ser hoy o en una fecha futura." };
    }
  }

  await prisma.seguimiento.create({
    data: {
      beneficiarioId,
      avanceNovedad,
      observacion,
      accionPendiente,
      proximoContacto,
      fecha,
    },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  redirect(`/beneficiarios/${beneficiarioId}`);
}

export async function actualizarSeguimiento(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const seguimientoId = String(formData.get("seguimientoId") ?? "");
  const beneficiarioId = String(formData.get("beneficiarioId") ?? "");
  const avanceNovedad = String(formData.get("avanceNovedad") ?? "").trim();
  const observacion = String(formData.get("observacion") ?? "").trim() || null;
  const accionPendiente = String(formData.get("accionPendiente") ?? "").trim() || null;
  const proximoContacto = parseFecha(formData.get("proximoContacto"));
  const fecha = parseFecha(formData.get("fecha")) ?? new Date();

  if (!seguimientoId || !beneficiarioId) return { error: "Seguimiento inválido." };
  if (avanceNovedad.length < 3) {
    return { error: "Describe el avance o la novedad (mínimo 3 caracteres)." };
  }
  if (esFechaFutura(fecha)) return { error: "La fecha del seguimiento no puede ser en el futuro." };
  if (accionPendiente && !proximoContacto) {
    return { error: "Si hay una acción pendiente, indica la fecha de próximo contacto." };
  }
  if (proximoContacto) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (proximoContacto.getTime() < hoy.getTime()) {
      return { error: "El próximo contacto debe ser hoy o en una fecha futura." };
    }
  }

  await prisma.seguimiento.update({
    where: { id: seguimientoId },
    data: { avanceNovedad, observacion, accionPendiente, proximoContacto, fecha },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  redirect(`/beneficiarios/${beneficiarioId}`);
}

/**
 * "Finalizar" un seguimiento no agrega un campo de estado nuevo al schema:
 * reutiliza la misma semántica que ya usan los indicadores y la ficha
 * (accionPendiente/proximoContacto en null = sin pendiente).
 */
export async function finalizarSeguimiento(formData: FormData): Promise<void> {
  const seguimientoId = String(formData.get("seguimientoId") ?? "");
  const beneficiarioId = String(formData.get("beneficiarioId") ?? "");
  const volverA = String(formData.get("volverA") ?? "").trim() || null;
  if (!seguimientoId || !beneficiarioId) return;

  await prisma.seguimiento.update({
    where: { id: seguimientoId },
    data: { accionPendiente: null, proximoContacto: null },
  });

  // Redirige siempre (a `volverA` si vino, o a la ficha) para que quede una
  // confirmación visible del cambio — quedarse en la misma pantalla sin
  // navegar dejaba la duda de si realmente se guardó.
  revalidatePath(`/beneficiarios/${beneficiarioId}`);
  revalidatePath(`/beneficiarios/${beneficiarioId}/seguimientos`);
  redirect(volverA || `/beneficiarios/${beneficiarioId}`);
}
