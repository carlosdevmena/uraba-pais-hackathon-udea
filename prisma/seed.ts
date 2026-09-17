import { PrismaClient, TipoPoblacion, EstadoParticipacion, LineaTrabajo } from "@prisma/client";

const prisma = new PrismaClient();

const MUNICIPIOS = ["Apartadó", "Turbo", "Necoclí"];
const POBLACIONES: TipoPoblacion[] = [
  TipoPoblacion.migrante,
  TipoPoblacion.refugiado,
  TipoPoblacion.desplazado,
  TipoPoblacion.victima_conflicto,
  TipoPoblacion.comunidad_acogida,
];
const ESTADOS: EstadoParticipacion[] = [
  EstadoParticipacion.inscrito,
  EstadoParticipacion.en_proceso,
  EstadoParticipacion.finalizado,
  EstadoParticipacion.retirado,
];

async function main() {
  await prisma.seguimiento.deleteMany();
  await prisma.atencion.deleteMany();
  await prisma.participacion.deleteMany();
  await prisma.familiarIntegrante.deleteMany();
  await prisma.beneficiario.deleteMany();
  await prisma.programa.deleteMany();

  const programas = await Promise.all([
    prisma.programa.create({
      data: { nombre: "Asistencia humanitaria y protección", lineaTrabajo: LineaTrabajo.R1 },
    }),
    prisma.programa.create({
      data: { nombre: "Salud y bienestar", lineaTrabajo: LineaTrabajo.R2 },
    }),
    prisma.programa.create({
      data: {
        nombre: "Integración socioeconómica y cohesión social",
        lineaTrabajo: LineaTrabajo.R3,
      },
    }),
  ]);

  const total = 14;
  for (let i = 0; i < total; i++) {
    const codigoInterno = `BEN-${String(i + 1).padStart(6, "0")}`;
    const tieneDocumento = i % 5 !== 0;

    const beneficiario = await prisma.beneficiario.create({
      data: {
        codigoInterno,
        nombres: `Beneficiario Ficticio ${i + 1}`,
        tipoDocumento: tieneDocumento ? "CC" : null,
        numeroDocumento: tieneDocumento ? `${100000000 + i}` : null,
        fechaNacimiento: new Date(1970 + (i % 45), i % 12, (i % 27) + 1),
        genero: i % 2 === 0 ? "Femenino" : "Masculino",
        municipio: MUNICIPIOS[i % MUNICIPIOS.length],
        telefono: `300${String(1000000 + i).slice(-7)}`,
        tipoPoblacion: POBLACIONES[i % POBLACIONES.length],
        discapacidad: i % 6 === 0,
        autorizacionDatos: true,
        fechaAutorizacion: new Date(),
        familiares: {
          create: [
            {
              nombres: `Familiar Ficticio ${i + 1}A`,
              parentesco: i % 2 === 0 ? "Hijo/a" : "Cónyuge",
              fechaNacimiento: new Date(1995 + (i % 20), i % 12, 10),
            },
          ],
        },
      },
    });

    const programa = programas[i % programas.length];
    await prisma.participacion.create({
      data: {
        beneficiarioId: beneficiario.id,
        programaId: programa.id,
        fechaVinculacion: new Date(2025, i % 12, 5),
        estado: ESTADOS[i % ESTADOS.length],
      },
    });

    await prisma.atencion.create({
      data: {
        beneficiarioId: beneficiario.id,
        tipo: i % 2 === 0 ? "Orientación y valoración" : "Entrega de ayuda humanitaria",
        fecha: new Date(2025, i % 12, 12),
        descripcion: "Atención inicial registrada como parte del prototipo de demostración.",
        responsable: "Equipo de campo (dato ficticio)",
        resultado: "Persona orientada y remitida al programa correspondiente",
      },
    });

    const tienePendiente = i % 3 !== 0;
    await prisma.seguimiento.create({
      data: {
        beneficiarioId: beneficiario.id,
        fecha: new Date(2025, i % 12, 20),
        avanceNovedad: tienePendiente
          ? "Seguimiento en curso, a la espera de confirmación"
          : "Proceso completado sin novedades",
        accionPendiente: tienePendiente ? "Confirmar asistencia a la próxima sesión" : null,
        proximoContacto: tienePendiente ? new Date(2025, (i % 12) + 1, 1) : null,
      },
    });
  }

  console.log(`Seed completado: ${programas.length} programas, ${total} beneficiarios ficticios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
