import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";

const prisma = new PrismaClient();
const RUTA_EXCEL = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "data",
  "Base_Beneficiarios_HackathonTest.xlsx"
);

const MAPA_TIPO_DOCUMENTO = { "CC/Documento": "CC" };
const MAPA_GENERO = { Mujer: "Femenino", Hombre: "Masculino" };
const MAPA_POBLACION = {
  Migrante: "migrante",
  "Refugiado/a o solicitante de asilo": "refugiado",
  "Retornado/a": "retornado",
  "Desplazado/a": "desplazado",
  "Población local": "comunidad_acogida",
};
// Estado del evento (Excel) -> estado de la participación en el programa
const MAPA_ESTADO_PARTICIPACION = {
  Pendiente: "inscrito",
  Atendido: "en_proceso",
  "En seguimiento": "en_proceso",
  Finalizado: "finalizado",
};
const MAPA_LINEA_PROGRAMA = { R1: "R1", R2: "R2", R3: "R3" };

function excelFechaAJs(serial) {
  if (!serial) return new Date();
  // Excel cuenta desde 1899-12-30 (incluye el falso bisiesto de 1900)
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(ms);
}

async function main() {
  const wb = XLSX.readFile(RUTA_EXCEL);
  const filas = XLSX.utils.sheet_to_json(wb.Sheets["BASE_BENEFICIARIOS"], { defval: null });
  console.log(`Leídas ${filas.length} filas del Excel.`);

  console.log("Limpiando datos ficticios anteriores...");
  await prisma.seguimiento.deleteMany();
  await prisma.atencion.deleteMany();
  await prisma.participacion.deleteMany();
  await prisma.familiarIntegrante.deleteMany();
  await prisma.beneficiario.deleteMany();
  await prisma.programa.deleteMany();

  const programasPorLinea = {
    R1: await prisma.programa.create({
      data: { nombre: "Asistencia humanitaria y protección", lineaTrabajo: "R1" },
    }),
    R2: await prisma.programa.create({ data: { nombre: "Salud y bienestar", lineaTrabajo: "R2" } }),
    R3: await prisma.programa.create({
      data: { nombre: "Integración socioeconómica y cohesión social", lineaTrabajo: "R3" },
    }),
  };

  let creados = 0;
  for (const fila of filas) {
    const tieneDocumento = fila.Tipo_documento !== "Sin documento";
    const tipoDocumento = tieneDocumento ? MAPA_TIPO_DOCUMENTO[fila.Tipo_documento] ?? "CC" : null;
    const numeroDocumento = tieneDocumento ? fila.Numero_documento_ficticio : null;
    const fechaRegistro = excelFechaAJs(fila.Fecha_registro);
    const fechaAtencion = excelFechaAJs(fila.Fecha_atencion);
    const linea = MAPA_LINEA_PROGRAMA[fila.Resultado_asociado] ?? "R1";
    const estadoParticipacion = MAPA_ESTADO_PARTICIPACION[fila.Estado] ?? "inscrito";
    const pendiente = fila.Estado === "Pendiente" || fila.Estado === "En seguimiento";

    await prisma.beneficiario.create({
      data: {
        codigoInterno: fila.ID_Beneficiario,
        nombres: fila.Nombre_completo,
        tipoDocumento,
        numeroDocumento,
        edadAproximada: fila.Edad ?? null,
        genero: MAPA_GENERO[fila.Sexo] ?? null,
        municipio: fila.Municipio ?? null,
        zona: fila.Zona ?? null,
        nacionalidad: fila.Nacionalidad ?? null,
        tipoPoblacion: MAPA_POBLACION[fila.Tipo_poblacion] ?? "otro",
        autorizacionDatos: true,
        fechaAutorizacion: fechaRegistro,
        createdAt: fechaRegistro,
        participaciones: {
          create: {
            programaId: programasPorLinea[linea].id,
            fechaVinculacion: fechaRegistro,
            estado: estadoParticipacion,
          },
        },
        atenciones: {
          create: {
            tipo: fila.Tipo_atencion_ayuda ?? "Atención",
            descripcion: fila.Actividad_recibida ?? "Actividad registrada",
            responsable: fila.Organización ?? "COOPI",
            resultado: fila.Estado ?? "Registrado",
            fecha: fechaAtencion,
          },
        },
        seguimientos: {
          create: {
            fecha: fechaAtencion,
            avanceNovedad: fila.Observaciones ?? "Sin observaciones.",
            accionPendiente: pendiente ? "Confirmar continuidad del caso con el beneficiario" : null,
            proximoContacto: pendiente
              ? new Date(fechaAtencion.getTime() + 14 * 24 * 60 * 60 * 1000)
              : null,
          },
        },
      },
    });
    creados++;
  }

  console.log(`Importados ${creados} beneficiarios reales (ficticios) desde el Excel.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
