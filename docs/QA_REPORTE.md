# Reporte de QA — URABÁ-PAÍS

**Fecha**: 2026-09-17
**Alcance**: reproducción y corrección del crash reportado al registrar un beneficiario con documento existente, más pruebas de regresión sobre los 4 módulos obligatorios.

## 1. Bug crítico encontrado y corregido

**Síntoma reportado**: al enviar el formulario de registro, la página completa fallaba ("This page couldn't load" — error nativo de Chrome, no una pantalla de error de la aplicación).

**Causa raíz**: el atributo `pattern` del campo "Nombres" (`[A-Za-zÁÉÍÓÚÑÜáéíóúñü' -]+`) es una expresión regular inválida bajo el modo Unicode `v` que los navegadores modernos usan para compilar el atributo `pattern` de HTML5. El guion sin escapar al final de una clase de caracteres con acentos ya no es válido en ese modo — Chrome lanzaba `Uncaught SyntaxError` al intentar validar el campo, lo que rompía la validación nativa del formulario en el momento del envío.

**Corrección**: se escapó el guion (`\-`) en las 3 ocurrencias del patrón (formulario principal, campo de familiar en el registro, y formulario de "agregar familiar"), tanto en el cliente como en su equivalente de validación en el servidor (`actions.ts`). Verificado con Node (`new RegExp(patrón, "v")`) que el patrón corregido es válido.

**Hallazgo relacionado**: el patrón de "Número de documento" (`[A-Za-z0-9]{4,15}`) tampoco permitía guiones, pero el formato real de los 100 documentos ficticios importados es `FIC-200001` (con guion). Esto impedía probar duplicados reales escribiendo el documento tal como aparece en los datos. Corregido para aceptar guiones.

## 2. Metodología

Se automatizó la reproducción con Playwright (`scripts/qa-test.mjs`) contra el servidor de desarrollo real y la base de datos real (Supabase), ejecutando 8 casos de extremo a extremo con navegador headless real (no mocks), capturando errores de consola JS y de página.

## 3. Casos probados y resultado

| # | Caso | Resultado |
|---|---|---|
| 1 | Registrar con un documento que ya existe en la base (`CC FIC-200001`, formato real con guion) | ✅ Muestra el aviso "Ya existe una persona registrada..." con enlace a la ficha existente. No crashea. |
| 2 | Registrar sin documento con un nombre muy similar a uno ya existente ("Mariana Cordoba Valencia" vs. "Mariana Córdoba Valencia" real) | ✅ Muestra la advertencia de coincidencia difusa (trigramas) antes de permitir continuar. |
| 3 | Registro válido, nuevo, sin conflictos | ✅ Crea el registro y redirige a la ficha consolidada. |
| 4 | Envío del formulario completamente vacío | ✅ Bloqueado por validación HTML5 nativa; no se envía al servidor. |
| 5 | Listar beneficiarios y abrir una ficha real desde la tabla | ✅ Carga sin errores. |
| 6 | Reportes con filtros combinados (municipio + tipo de población) | ✅ Carga sin errores. |
| — | Errores de consola JS durante toda la sesión | ✅ Ninguno. |

**8/8 casos correctos** tras la corrección. La suite queda en `scripts/qa-test.mjs` y se puede volver a ejecutar en cualquier momento con:

```bash
node scripts/qa-test.mjs
```

(limpia sus propios datos de prueba automáticamente al inicio y al final).

## 4. Suite automatizada permanente (Vitest)

Además de la prueba manual con navegador, se creó `tests/roles/role-agent.test.ts`: 9 pruebas que ejecutan las Server Actions directamente contra la base real, organizadas por rol:

- **Funcionario**: registro con/sin familiar, detección difusa, atención + seguimiento.
- **Administrador**: transición completa de estado de una participación, bloqueo de doble vinculación activa.
- **Analista M&E**: los indicadores reflejan conteos reales; los agregados no exponen nombres/documento/teléfono.
- **Público**: el catálogo de programas no expone datos personales.

Total: **17/17 pruebas automatizadas pasan** (`npm test`), incluyendo las 8 de `lib/trigram.test.ts` ya existentes.

## 5. Otras respuestas de esta ronda

- **¿Por qué muchos registros no tienen fecha de nacimiento ni teléfono?** El Excel de referencia (100 personas) no incluye esas columnas; sí incluye "Edad" (mapeada a `edadAproximada`). No es un error: 0/100 tienen fecha de nacimiento o teléfono, 100/100 tienen edad aproximada. Ninguno de los dos campos es obligatorio en el esquema ni en la guía oficial.
- **¿Está todo migrado en la base?** Sí, confirmado: esquema sincronizado (`prisma db push`) y 100 beneficiarios reales importados, verificado en vivo contra Supabase antes de este reporte.
