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
      ],
    },
  });
  if (count > 0) console.log(`(limpieza) ${count} registro(s) de ejecuciones anteriores eliminados`);
}

async function nuevaPagina(browser) {
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") erroresConsola.push(msg.text());
  });
  page.on("pageerror", (err) => erroresConsola.push("pageerror: " + err.message));
  return page;
}

function esCrash(texto) {
  return /couldn.?t load|application error|ERR_/i.test(texto);
}

async function main() {
  await limpiarDatosDePrueba();
  const browser = await chromium.launch();

  // CASO 1: documento existente (usando un registro real importado, con guion)
  {
    const page = await nuevaPagina(browser);
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
    await page.click('button[type="submit"]');
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
    const page = await nuevaPagina(browser);
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // margen de hidratación de React (Turbopack dev)
    await page.fill('input[name="nombres"]', "Mariana Cordoba Valencia");
    await page.selectOption('select[name="tipoPoblacion"]', "migrante");
    await page.selectOption('select[name="genero"]', "Femenino");
    await page.selectOption('select[name="municipio"]', "Apartadó");
    await page.fill('input[name="edadAproximada"]', "30");
    await page.check('input[name="autorizacionDatos"]');
    await page.click('button[type="submit"]');
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
    const page = await nuevaPagina(browser);
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
    const valores = {
      nombres: await page.inputValue('input[name="nombres"]'),
      tipoPoblacion: await page.inputValue('select[name="tipoPoblacion"]'),
      genero: await page.inputValue('select[name="genero"]'),
      municipio: await page.inputValue('select[name="municipio"]'),
      edad: await page.inputValue('input[name="edadAproximada"]'),
      autorizacion: await page.isChecked('input[name="autorizacionDatos"]'),
    };
    console.log("  valores del formulario antes de enviar:", JSON.stringify(valores));
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/beneficiarios\/(?!nuevo)[a-z0-9]{10,}$/, { timeout: 8000 }).catch(() => {});
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
    const page = await nuevaPagina(browser);
    await page.goto(`${BASE}/beneficiarios/nuevo`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // margen de hidratación de React (Turbopack dev)
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    log("Formulario vacío no se envía (validación HTML5)", page.url().includes("/beneficiarios/nuevo"), `url: ${page.url()}`);
    await page.close();
  }

  // CASO 5: buscar en /beneficiarios y abrir una ficha real
  {
    const page = await nuevaPagina(browser);
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
    const page = await nuevaPagina(browser);
    await page.goto(`${BASE}/reportes?municipio=Turbo&poblacion=migrante`, { waitUntil: "networkidle" });
    const bodyReportes = await page.locator("body").innerText().catch(() => "");
    log("Reportes con filtros combinados", !esCrash(bodyReportes), esCrash(bodyReportes) ? bodyReportes.slice(0, 200) : "ok");
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
