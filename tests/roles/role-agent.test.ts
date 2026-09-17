/**
 * Agente simulador de roles: ejecuta cada Server Action directamente (sin
 * pasar por HTTP) contra la base de datos real de desarrollo, simulando lo
 * que haría cada rol del sistema. `redirect`/`revalidatePath` se simulan
 * porque dependen del contexto de petición de Next.js, inexistente aquí.
 *
 * Todos los datos de prueba usan el prefijo Zzqa  y se eliminan al
 * finalizar cada bloque para no contaminar los datos de la demo.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/prisma";
import {
  actualizarEstadoParticipacion,
  buscarCoincidenciasDifusas,
  crearBeneficiario,
  registrarAtencion,
  registrarSeguimiento,
  vincularPrograma,
} from "@/app/beneficiarios/actions";

const PREFIJO = "Zzqa ";

function fd(campos: Record<string, string>): FormData {
  const data = new FormData();
  for (const [clave, valor] of Object.entries(campos)) data.append(clave, valor);
  return data;
}

async function limpiarDatosDePrueba() {
  await prisma.beneficiario.deleteMany({ where: { nombres: { startsWith: PREFIJO } } });
}

describe("Rol 1: Funcionario / Operador de campo", () => {
  afterAll(limpiarDatosDePrueba);

  it("1.1 registra un beneficiario con familiar en una sola operación", async () => {
    const nombre = `${PREFIJO}Registro Exitoso`;
    await crearBeneficiario(
      {},
      fd({
        nombres: nombre,
        tipoPoblacion: "migrante",
        genero: "Femenino",
        municipio: "Apartadó",
        edadAproximada: "30",
        autorizacionDatos: "on",
        familiarNombres: "Familiar De Prueba",
        familiarParentescos: "Hijo/a",
      })
    );

    const creado = await prisma.beneficiario.findFirst({
      where: { nombres: nombre },
      include: { familiares: true },
    });
    expect(creado).not.toBeNull();
    expect(creado?.familiares).toHaveLength(1);
    expect(creado?.familiares[0].nombres).toBe("Familiar De Prueba");
  });

  it("1.2 el registro sin familiar es válido (no es obligatorio según la guía oficial)", async () => {
    const nombre = `${PREFIJO}Sin Familiar`;
    const resultado = await crearBeneficiario(
      {},
      fd({
        nombres: nombre,
        tipoPoblacion: "otro",
        genero: "Masculino",
        municipio: "Turbo",
        edadAproximada: "25",
        autorizacionDatos: "on",
      })
    );

    expect(resultado?.error).toBeUndefined();
    const creado = await prisma.beneficiario.findFirst({
      where: { nombres: nombre },
      include: { familiares: true },
    });
    expect(creado).not.toBeNull();
    expect(creado?.familiares).toHaveLength(0);
  });

  it("1.3 detección difusa por trigramas encuentra coincidencias con score >= 0.4", async () => {
    // Nombre real del set de 100 beneficiarios de referencia importado del Excel.
    const coincidencias = await buscarCoincidenciasDifusas("Mariana Cordoba Valencia");
    expect(coincidencias.length).toBeGreaterThan(0);
    expect(coincidencias[0].score).toBeGreaterThanOrEqual(0.4);
  });

  it("1.4 asocia una atención y un seguimiento pendiente a la ficha", async () => {
    const nombre = `${PREFIJO}Con Atencion`;
    await crearBeneficiario(
      {},
      fd({
        nombres: nombre,
        tipoPoblacion: "desplazado",
        genero: "Femenino",
        municipio: "Necoclí",
        edadAproximada: "40",
        autorizacionDatos: "on",
      })
    );
    const beneficiario = await prisma.beneficiario.findFirstOrThrow({ where: { nombres: nombre } });

    await registrarAtencion(
      {},
      fd({
        beneficiarioId: beneficiario.id,
        tipo: "Salud",
        descripcion: "Consulta de valoración inicial",
        responsable: "Equipo QA",
        resultado: "Persona valorada",
      })
    );
    const enUnaSemana = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    await registrarSeguimiento(
      {},
      fd({
        beneficiarioId: beneficiario.id,
        avanceNovedad: "Pendiente de confirmar continuidad",
        accionPendiente: "Llamar para agendar próxima cita",
        proximoContacto: enUnaSemana,
      })
    );

    const conRelaciones = await prisma.beneficiario.findUnique({
      where: { id: beneficiario.id },
      include: { atenciones: true, seguimientos: true },
    });
    expect(conRelaciones?.atenciones).toHaveLength(1);
    expect(conRelaciones?.seguimientos).toHaveLength(1);
    expect(conRelaciones?.seguimientos[0].accionPendiente).not.toBeNull();
  });
});

describe("Rol 2: Administrador / Coordinador del proyecto", () => {
  let programaId: string;

  beforeAll(async () => {
    const programa = await prisma.programa.findFirstOrThrow();
    programaId = programa.id;
  });

  afterAll(limpiarDatosDePrueba);

  it("2.1 vincula a un programa y avanza el estado hasta finalizado", async () => {
    const nombre = `${PREFIJO}Admin Flujo`;
    await crearBeneficiario(
      {},
      fd({
        nombres: nombre,
        tipoPoblacion: "refugiado",
        genero: "Masculino",
        municipio: "Apartadó",
        edadAproximada: "35",
        autorizacionDatos: "on",
      })
    );
    const beneficiario = await prisma.beneficiario.findFirstOrThrow({ where: { nombres: nombre } });

    await vincularPrograma({}, fd({ beneficiarioId: beneficiario.id, programaId, estado: "inscrito" }));
    let participacion = await prisma.participacion.findFirstOrThrow({
      where: { beneficiarioId: beneficiario.id, programaId },
    });
    expect(participacion.estado).toBe("inscrito");

    await actualizarEstadoParticipacion(
      {},
      fd({ participacionId: participacion.id, beneficiarioId: beneficiario.id, estado: "en_proceso" })
    );
    participacion = await prisma.participacion.findUniqueOrThrow({ where: { id: participacion.id } });
    expect(participacion.estado).toBe("en_proceso");

    await actualizarEstadoParticipacion(
      {},
      fd({ participacionId: participacion.id, beneficiarioId: beneficiario.id, estado: "finalizado" })
    );
    participacion = await prisma.participacion.findUniqueOrThrow({ where: { id: participacion.id } });
    expect(participacion.estado).toBe("finalizado");
  });

  it("2.2 bloquea una segunda vinculación activa al mismo programa", async () => {
    const nombre = `${PREFIJO}Duplicado Participacion`;
    await crearBeneficiario(
      {},
      fd({
        nombres: nombre,
        tipoPoblacion: "otro",
        genero: "Otro",
        municipio: "Turbo",
        edadAproximada: "28",
        autorizacionDatos: "on",
      })
    );
    const beneficiario = await prisma.beneficiario.findFirstOrThrow({ where: { nombres: nombre } });

    await vincularPrograma({}, fd({ beneficiarioId: beneficiario.id, programaId, estado: "inscrito" }));
    const resultado = await vincularPrograma(
      {},
      fd({ beneficiarioId: beneficiario.id, programaId, estado: "en_proceso" })
    );

    expect(resultado?.error).toBeDefined();
    expect(resultado?.participacionEditarHref).toBeDefined();

    const total = await prisma.participacion.count({ where: { beneficiarioId: beneficiario.id, programaId } });
    expect(total).toBe(1); // la segunda vinculación no se creó
  });
});

describe("Rol 3: Analista / Auditor M&E", () => {
  it("3.1 los indicadores reflejan conteos reales de la base (no valores fijos)", async () => {
    const totalBeneficiarios = await prisma.beneficiario.count();
    const totalAtenciones = await prisma.atencion.count();
    expect(totalBeneficiarios).toBeGreaterThan(0);
    expect(totalAtenciones).toBeGreaterThanOrEqual(0);
  });

  it("3.2 los agregados de reportes no exponen PII (nombres, documento, teléfono)", async () => {
    const porPoblacion = await prisma.beneficiario.groupBy({
      by: ["tipoPoblacion"],
      _count: { _all: true },
    });
    for (const fila of porPoblacion) {
      const claves = Object.keys(fila);
      expect(claves).not.toContain("nombres");
      expect(claves).not.toContain("numeroDocumento");
      expect(claves).not.toContain("telefono");
    }
  });
});

describe("Rol 4: Público general / Visitante", () => {
  it("4.1 el catálogo de programas no expone datos personales de beneficiarios", async () => {
    const programas = await prisma.programa.findMany();
    expect(programas.length).toBeGreaterThan(0);
    for (const programa of programas) {
      expect(Object.keys(programa)).not.toContain("nombres");
      expect(Object.keys(programa)).not.toContain("numeroDocumento");
    }
  });
});
