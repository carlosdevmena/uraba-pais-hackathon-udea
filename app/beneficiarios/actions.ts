"use server";

import { prisma } from "@/lib/prisma";
import { EstadoParticipacion, TipoPoblacion } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CrearBeneficiarioState = {
  error?: string;
  duplicadoId?: string;
};

function parseFecha(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const fecha = new Date(raw);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
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
  _prevState: CrearBeneficiarioState,
  formData: FormData
): Promise<CrearBeneficiarioState> {
  const nombres = String(formData.get("nombres") ?? "").trim();
  const tipoDocumento = String(formData.get("tipoDocumento") ?? "").trim() || null;
  const numeroDocumento = String(formData.get("numeroDocumento") ?? "").trim() || null;
  const genero = String(formData.get("genero") ?? "").trim() || null;
  const municipio = String(formData.get("municipio") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const tipoPoblacionRaw = String(formData.get("tipoPoblacion") ?? "otro");
  const discapacidad = formData.get("discapacidad") === "on";
  const autorizacionDatos = formData.get("autorizacionDatos") === "on";
  const fechaNacimiento = parseFecha(formData.get("fechaNacimiento"));

  const familiarNombres = formData.getAll("familiarNombres").map((v) => String(v).trim());
  const familiarParentescos = formData.getAll("familiarParentescos").map((v) => String(v).trim());

  if (!nombres) {
    return { error: "El nombre es obligatorio." };
  }
  if (!autorizacionDatos) {
    return {
      error: "Debes registrar la autorización para el tratamiento de datos antes de continuar.",
    };
  }

  if (tipoDocumento && numeroDocumento) {
    const existente = await prisma.beneficiario.findFirst({
      where: { tipoDocumento, numeroDocumento },
      select: { id: true, nombres: true, codigoInterno: true },
    });
    if (existente) {
      return {
        error: `Ya existe una persona registrada con este tipo y número de documento: ${existente.nombres} (${existente.codigoInterno}).`,
        duplicadoId: existente.id,
      };
    }
  }

  const codigoInterno = await generarCodigoInterno();
  const tipoPoblacion = Object.values(TipoPoblacion).includes(tipoPoblacionRaw as TipoPoblacion)
    ? (tipoPoblacionRaw as TipoPoblacion)
    : TipoPoblacion.otro;

  const beneficiario = await prisma.beneficiario.create({
    data: {
      codigoInterno,
      nombres,
      tipoDocumento,
      numeroDocumento,
      fechaNacimiento,
      genero,
      municipio,
      telefono,
      tipoPoblacion,
      discapacidad,
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

export async function agregarFamiliar(formData: FormData) {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const nombres = String(formData.get("nombres") ?? "").trim();
  const parentesco = String(formData.get("parentesco") ?? "").trim() || "Familiar";
  const fechaNacimiento = parseFecha(formData.get("fechaNacimiento"));

  if (!beneficiarioId || !nombres) return;

  await prisma.familiarIntegrante.create({
    data: { beneficiarioId, nombres, parentesco, fechaNacimiento },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
}

export async function vincularPrograma(formData: FormData) {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const programaId = String(formData.get("programaId"));
  const estadoRaw = String(formData.get("estado") ?? "inscrito");
  const fechaVinculacion = parseFecha(formData.get("fechaVinculacion")) ?? new Date();

  if (!beneficiarioId || !programaId) return;

  const estado = Object.values(EstadoParticipacion).includes(estadoRaw as EstadoParticipacion)
    ? (estadoRaw as EstadoParticipacion)
    : EstadoParticipacion.inscrito;

  await prisma.participacion.create({
    data: { beneficiarioId, programaId, estado, fechaVinculacion },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
}

export async function registrarAtencion(formData: FormData) {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const tipo = String(formData.get("tipo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const resultado = String(formData.get("resultado") ?? "").trim();
  const remision = String(formData.get("remision") ?? "").trim() || null;
  const fecha = parseFecha(formData.get("fecha")) ?? new Date();

  if (!beneficiarioId || !tipo || !descripcion || !responsable || !resultado) return;

  await prisma.atencion.create({
    data: { beneficiarioId, tipo, descripcion, responsable, resultado, remision, fecha },
  });

  revalidatePath(`/beneficiarios/${beneficiarioId}`);
}

export async function registrarSeguimiento(formData: FormData) {
  const beneficiarioId = String(formData.get("beneficiarioId"));
  const avanceNovedad = String(formData.get("avanceNovedad") ?? "").trim();
  const observacion = String(formData.get("observacion") ?? "").trim() || null;
  const accionPendiente = String(formData.get("accionPendiente") ?? "").trim() || null;
  const proximoContacto = parseFecha(formData.get("proximoContacto"));
  const fecha = parseFecha(formData.get("fecha")) ?? new Date();

  if (!beneficiarioId || !avanceNovedad) return;

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
}
