import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const resultados = [];
const prisma = new PrismaClient();
const erroresConsola = [];

function log(caso, ok, detalle) {
  resultados.push({ caso, ok, detalle });
  console.log(`${ok ? "OK " : "FAIL"} - ${caso}${detalle ? " -> " + detalle : ""}`);
}

async function limpiarDatosDePrueba() {
  const { count } = await prisma.beneficiario.deleteMany({
    where: {
      OR: [
        { nombres: { startsWith: "Persona De Prueba QA" } },
        { nombres: { startsWith: "Zzz Persona Unica QA Test" } },
        { nombres: { startsWith: "Qqw Flujo Seguimiento QA" } },
      ],
    },
  });
  if (count > 0) console.log(`(limpieza) ${count} registro(s) de ejecuciones anteriores eliminados`);
}

async function nuevaPagina(context) {
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") erroresConsola.push(msg.text());
  });
  page.on("pageerror", (err) => erroresConsola.push("pageerror: " + err.message));
  return page;
}

function esCrash(texto) {
  return /couldn.?t load|application error|ERR_/i.test(texto);
}

// Las rutas /beneficiarios* y /reportes* ahora están bloqueadas por
// proxy.ts según el rol (cookie httpOnly) — hay que iniciar sesión como
// Administrador antes de correr los casos, en un contexto compartido para
// que la cookie de sesión persista entre páginas.
async function loginComoAdministrador(context) {
  const page = await nuevaPagina(context);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // El panel de accesos rápidos de demo se quitó del login — se entra con
  // el formulario real de correo/contraseña.
  await page.fill('input[name="correo"]', "admin@urabapais.org");
  await page.fill('input[name="clave"]', "Admin.2026*");
  await page.click('main button[type="submit"]');
  await page.waitForURL(/\/beneficiarios$/, { timeout: 20000 });
  const ok = page.url().endsWith("/beneficiarios");
  log("Login con correo/contraseña (Administrador)", ok, `url: ${page.url()}`);
  await page.close();
}

async function main() {
  await limpiarDatosDePrueba();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await loginComoAdministrador(context);

  // CASO 1: documento existente (usando un registro real importado, con guion)
  {
    const page = await nuevaPagina(context);
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // margen de hidratación de React (Turbopack dev)
    await page.fill('input[name="nombres"]', "Persona De Prueba QA");
    await page.selectOption('select[name="tipoPoblacion"]', "migrante");
    await page.selectOption('select[name="tipoDocumento"]', "CC");
    await page.fill('input[name="numeroDocumento"]', "FIC-200001");
    await page.selectOption('select[name="genero"]', "Femenino");
    await page.selectOption('select[name="municipio"]', "Apartadó");
    await page.fill('input[name="edadAproximada"]', "30");
    await page.check('input[name="autorizacionDatos"]');
    await page.fill('input[name="familiarNombres"] >> nth=0', "Familiar De Prueba QA");
    await page.fill('input[name="familiarParentescos"] >> nth=0', "Hijo/a");
    await page.click('main button[type="submit"]');
    const muestraAviso = await page
      .getByText("Ya existe una persona registrada", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    const bodyText = await page.locator("body").innerText().catch(() => "");
    log("Registrar con documento existente (FIC-200001)", !esCrash(bodyText), esCrash(bodyText) ? bodyText.slice(0, 200) : "ok");
    log("  -> Muestra aviso de duplicado exacto", muestraAviso);
    await page.close();
  }

  // CASO 2: registro sin documento, nombre parecido a uno existente (debe advertir por difusa)
  {
    const page = await nuevaPagina(context);
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // margen de hidratación de React (Turbopack dev)
    await page.fill('input[name="nombres"]', "Mariana Cordoba Valencia");
    await page.selectOption('select[name="tipoPoblacion"]', "migrante");
    await page.selectOption('select[name="genero"]', "Femenino");
    await page.selectOption('select[name="municipio"]', "Apartadó");
    await page.fill('input[name="edadAproximada"]', "30");
    await page.check('input[name="autorizacionDatos"]');
    await page.fill('input[name="familiarNombres"] >> nth=0', "Familiar De Prueba QA");
    await page.fill('input[name="familiarParentescos"] >> nth=0', "Hijo/a");
    await page.click('main button[type="submit"]');
    const avisoDifuso = await page
      .getByText("encontramos nombres parecidos", { exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    const bodyText = await page.locator("body").innerText().catch(() => "");
    log(
      "Registrar sin documento con nombre parecido (Mariana Cordoba Valencia)",
      !esCrash(bodyText) && avisoDifuso,
      esCrash(bodyText) ? bodyText.slice(0, 200) : `aviso difuso mostrado: ${avisoDifuso}`
    );
    await page.close();
  }

  // CASO 3: registro completamente válido y nuevo (debe crear y redirigir a la ficha)
  {
    const page = await nuevaPagina(context);
    const sufijo = Math.random().toString(36).replace(/[^a-z]/g, "").padEnd(6, "x").slice(0, 6);
    const nombreUnico = `Zzz Persona Unica QA Test ${sufijo}`;
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // margen de hidratación de React (Turbopack dev)
    await page.fill('input[name="nombres"]', nombreUnico);
    await page.selectOption('select[name="tipoPoblacion"]', "otro");
    await page.selectOption('select[name="genero"]', "Prefiere no decir");
    await page.selectOption('select[name="municipio"]', "Turbo");
    await page.fill('input[name="edadAproximada"]', "40");
    await page.check('input[name="autorizacionDatos"]');
    await page.fill('input[name="familiarNombres"] >> nth=0', "Familiar De Prueba QA");
    await page.fill('input[name="familiarParentescos"] >> nth=0', "Hijo/a");
    const valores = {
      nombres: await page.inputValue('input[name="nombres"]'),
      tipoPoblacion: await page.inputValue('select[name="tipoPoblacion"]'),
      genero: await page.inputValue('select[name="genero"]'),
      municipio: await page.inputValue('select[name="municipio"]'),
      edad: await page.inputValue('input[name="edadAproximada"]'),
      autorizacion: await page.isChecked('input[name="autorizacionDatos"]'),
      familiar: await page.inputValue('input[name="familiarNombres"] >> nth=0'),
    };
    console.log("  valores del formulario antes de enviar:", JSON.stringify(valores));
    await page.click('main button[type="submit"]');
    await page.waitForURL(/\/beneficiarios\/(?!nuevo)[a-z0-9]{10,}$/, { timeout: 20000 }).catch(() => {});
    const url3 = page.url();
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const redirigioAFicha = /\/beneficiarios\/(?!nuevo)[a-z0-9]{10,}$/.test(url3);
    log(
      "Registro válido y nuevo redirige a la ficha",
      !esCrash(bodyText) && redirigioAFicha,
      redirigioAFicha ? `url final: ${url3}` : `url: ${url3} | body: ${bodyText.slice(0, 400)}`
    );
    await page.close();
  }

  // CASO 4: campos obligatorios vacíos (debe bloquear via HTML5, no crashear)
  {
    const page = await nuevaPagina(context);
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // margen de hidratación de React (Turbopack dev)
    await page.click('main button[type="submit"]');
    await page.waitForTimeout(500);
    log("Formulario vacío no se envía (validación HTML5)", page.url().includes("/beneficiarios/nuevo"), `url: ${page.url()}`);
    await page.close();
  }

  // CASO 5: buscar en /beneficiarios y abrir una ficha real
  {
    const page = await nuevaPagina(context);
    await page.goto(`${BASE}/beneficiarios`, { waitUntil: "networkidle" });
    const filasVisibles = await page.locator("tbody tr").count();
    log("Listado de beneficiarios carga filas", filasVisibles > 0, `filas: ${filasVisibles}`);

    await page.locator("text=Ver ficha").first().click();
    await page.waitForLoadState("networkidle");
    const bodyFicha = await page.locator("body").innerText().catch(() => "");
    log("Abrir ficha desde el listado", !esCrash(bodyFicha), esCrash(bodyFicha) ? bodyFicha.slice(0, 200) : "ok");
    await page.close();
  }

  // CASO 6: reportes carga con filtros
  {
    const page = await nuevaPagina(context);
    await page.goto(`${BASE}/reportes?municipio=Turbo&poblacion=migrante`, { waitUntil: "networkidle" });
    const bodyReportes = await page.locator("body").innerText().catch(() => "");
    log("Reportes con filtros combinados", !esCrash(bodyReportes), esCrash(bodyReportes) ? bodyReportes.slice(0, 200) : "ok");
    await page.close();
  }

  // CASO 7: sin sesión, /beneficiarios y /reportes deben redirigir a /login (proxy.ts)
  {
    const contextAnonimo = await browser.newContext();
    const page = await nuevaPagina(contextAnonimo);
    await page.goto(`${BASE}/beneficiarios`, { waitUntil: "networkidle" });
    log("Acceso sin sesión a /beneficiarios redirige a /login", page.url().endsWith("/login"), `url: ${page.url()}`);
    await page.goto(`${BASE}/reportes`, { waitUntil: "networkidle" });
    log("Acceso sin sesión a /reportes redirige a /login", page.url().endsWith("/login"), `url: ${page.url()}`);
    await page.close();
    await contextAnonimo.close();
  }

  // CASO 8: editar y finalizar un seguimiento (crea beneficiario + seguimiento con pendiente)
  {
    const page = await nuevaPagina(context);
    const sufijo = Math.random().toString(36).replace(/[^a-z]/g, "").padEnd(6, "x").slice(0, 6);
    // Prefijo distinto de los otros casos: evita que la detección difusa (que
    // compara contra TODOS los registros de prueba ya creados en esta misma
    // corrida) confunda este registro con los de los casos 1-3.
    const nombreUnico = `Qqw Flujo Seguimiento QA ${sufijo}`;
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.fill('input[name="nombres"]', nombreUnico);
    await page.selectOption('select[name="tipoPoblacion"]', "otro");
    await page.selectOption('select[name="genero"]', "Otro");
    await page.selectOption('select[name="municipio"]', "Necoclí");
    await page.fill('input[name="edadAproximada"]', "22");
    await page.check('input[name="autorizacionDatos"]');
    await page.fill('input[name="familiarNombres"] >> nth=0', "Familiar De Prueba QA");
    await page.fill('input[name="familiarParentescos"] >> nth=0', "Hijo/a");
    await page.click('main button[type="submit"]');
    // Si por coincidencia el registro es marcado como parecido a otro ya
    // creado en la corrida, confirmar y reintentar una vez.
    const avisoDifusoCaso8 = await page
      .getByText("encontramos nombres parecidos", { exact: false })
      .first()
      .isVisible()
      .catch(() => false);
    if (avisoDifusoCaso8) {
      await page.check('input[name="confirmarSinCoincidencia"]');
      await page.click('main button[type="submit"]');
    }
    await page.waitForURL(/\/beneficiarios\/(?!nuevo)[a-z0-9]{10,}$/, { timeout: 20000 });
    const beneficiarioUrl = page.url();

    await page.goto(`${beneficiarioUrl}/seguimientos/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.fill('input[name="avanceNovedad"]', "Seguimiento de prueba QA");
    await page.fill('input[name="accionPendiente"]', "Llamar de nuevo");
    const enUnaSemana = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    await page.fill('input[name="proximoContacto"]', enUnaSemana);
    await page.click('main button[type="submit"]');
    await page.waitForURL(beneficiarioUrl, { timeout: 20000 }).catch(() => {});

    const editarLink = page.getByRole("link", { name: "Editar", exact: true }).first();
    await editarLink.click();
    await page.waitForURL(/\/seguimientos\/([a-z0-9]+)\/editar$/, { timeout: 20000 });
    const seguimientoId = page.url().match(/\/seguimientos\/([a-z0-9]+)\/editar$/)?.[1];
    log("Abrir edición de seguimiento", Boolean(seguimientoId), `url: ${page.url()}`);

    const botonFinalizar = page.getByRole("button", { name: "Finalizar pendiente" });
    await botonFinalizar.waitFor({ state: "visible", timeout: 10000 });
    await botonFinalizar.click();
    await page.waitForLoadState("networkidle");
    // Se verifica en la base de datos (no por texto en pantalla) para evitar
    // falsos negativos por timing de hidratación tras la navegación. Se
    // reintenta brevemente por si la escritura aún no se refleja.
    let seguimientoActualizado = null;
    for (let intento = 0; intento < 6 && seguimientoId; intento++) {
      seguimientoActualizado = await prisma.seguimiento.findUnique({ where: { id: seguimientoId } });
      if (seguimientoActualizado?.accionPendiente === null) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    const yaNoPendiente = seguimientoActualizado?.accionPendiente === null;
    log("Finalizar seguimiento limpia el pendiente", yaNoPendiente);

    await page.close();
  }

  console.log("\n--- Errores de consola JS capturados durante toda la sesión ---");
  console.log(erroresConsola.length === 0 ? "Ninguno" : erroresConsola.join("\n"));

  await browser.close();
  await limpiarDatosDePrueba();
  await prisma.$disconnect();

  const fallidos = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallidos.length}/${resultados.length} casos OK`);
  if (fallidos.length > 0) {
    console.log("Casos fallidos:", fallidos.map((f) => f.caso).join(", "));
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error("Error ejecutando QA:", e);
  await limpiarDatosDePrueba().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
