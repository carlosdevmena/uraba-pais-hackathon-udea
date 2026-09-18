# Descripción de la solución — URABÁ-PAÍS

## Problema atendido

Una misma persona beneficiaria puede participar en varios programas y recibir atención de distintos profesionales u organizaciones. Cuando esa información queda dispersa en archivos y formularios separados, el seguimiento se vuelve lento e incompleto y es difícil responder quién fue atendido, qué recibió, cuáles han sido sus avances y qué queda pendiente. Este prototipo centraliza esa información en una ficha única por persona.

## Requerimientos atendidos

| Módulo obligatorio | Cómo se resuelve |
|---|---|
| 1. Beneficiarios y familias | Registro, búsqueda, consulta y edición de la persona; registro de integrantes de su núcleo familiar; regla anti-duplicados por tipo + número de documento (constraint único en base de datos + verificación previa a la creación). |
| 2. Programas y participación | Vinculación del beneficiario a uno o varios programas, con fecha de vinculación y estado (inscrito, en proceso, finalizado, retirado). |
| 3. Atención y seguimiento | Registro de atenciones/ayudas (qué se entregó o realizó) y de seguimientos (qué cambió y qué queda pendiente), ambos con fecha y responsable/observación. |
| 4. Consultas y reportes | Ficha consolidada por beneficiario (datos, familia, programas, atenciones, seguimientos) y página de indicadores dinámicos calculados en tiempo real, sin datos personales. |

## Arquitectura

- **Next.js (App Router, TypeScript)**: aplicación full-stack en un solo repositorio. Las mutaciones (crear beneficiario, vincular programa, registrar atención, registrar seguimiento) se implementan como *Server Actions*, sin necesidad de una API REST separada.
- **Prisma + PostgreSQL (Supabase)**: capa de datos relacional. Se eligió un modelo relacional porque el dominio es inherentemente relacional (una persona con múltiples familiares, participaciones, atenciones y seguimientos) y porque permite expresar la regla anti-duplicados como una restricción `UNIQUE` real a nivel de base de datos, además de la verificación en la aplicación.
- **Tailwind CSS** para la interfaz.
- **Despliegue**: Vercel (aplicación) + Supabase (base de datos ya hospedada).

## Estructura de datos

- **Beneficiario**: código interno inmutable generado por el sistema, nombres, tipo/número de documento (opcional), fecha de nacimiento, género, municipio, contacto, tipo de población (migrante, refugiado, desplazado, víctima del conflicto, comunidad de acogida, otro), discapacidad, autorización de tratamiento de datos.
- **FamiliarIntegrante**: integrante del núcleo familiar asociado a un beneficiario.
- **Programa**: catálogo de programas por línea de trabajo (asistencia humanitaria y protección; salud y bienestar; integración socioeconómica y cohesión social).
- **Participacion**: vínculo entre un beneficiario y un programa, con fecha y estado.
- **Atencion**: atención o ayuda entregada (tipo, fecha, descripción, responsable, resultado, remisión).
- **Seguimiento**: seguimiento posterior (avance/novedad, observación, acción pendiente, próximo contacto).

### Regla anti-duplicados

Antes de crear un registro, el sistema busca por nombre, documento o código interno. Si el tipo y número de documento coinciden exactamente con un registro existente, el sistema **no crea** un nuevo beneficiario: muestra un aviso y un enlace directo a la ficha existente. A nivel de base de datos, un constraint único sobre `(tipoDocumento, numeroDocumento)` impide la duplicidad incluso si se intenta por otra vía. Las personas sin documento no colisionan entre sí (los valores nulos no se consideran iguales).

### Regla de conteo

Cada persona conserva un único código interno aunque acumule múltiples participaciones, atenciones o seguimientos. Los reportes cuentan **personas únicas** por separado de los **eventos** (participaciones, atenciones, seguimientos).

## Tipos de usuario e inicio de sesión

El inicio de sesión y los permisos son un componente **complementario** según la guía oficial; se implementaron en esta versión sobre el flujo obligatorio ya funcional, no en su lugar. Es un acceso de demostración (`/login`, con selector rápido de 1 clic para jurado/evaluadores) basado en una cookie de sesión `httpOnly` — no hay tabla de usuarios ni verificación de credenciales contra una base de datos, porque el schema del proyecto no la requiere para el alcance del reto.

| Tipo de usuario | Qué ve |
|---|---|
| **Administrador** | Acceso completo: `/beneficiarios` (consulta, registro, fichas) y `/reportes` (indicadores, gráfico temporal, exportación CSV, auditoría de duplicados). |
| **Funcionario** | `/beneficiarios` (consulta, registro con familiar y atenciones, fichas); sin acceso a `/reportes`. |
| **Público / no autenticado** | Solo la landing, la galería del proyecto, las líneas de trabajo, los logos de aliados y el marco legal — `/beneficiarios*` y `/reportes*` quedan bloqueados y redirigen a `/login`. |

El bloqueo por rol se aplica en `proxy.ts` (Next.js Proxy, ejecutado en cada request) además de ocultarse en el `NavBar`, para que no dependa únicamente de la interfaz. Ninguno de los roles ve datos personales en pantallas públicas o reportes agregados; ambos ven la ficha consolidada solo dentro del flujo de atención autorizado.

## Protección de datos y enfoque inclusivo

- Todos los datos usados (seed y pruebas) son ficticios; no se usa ninguna información real.
- Registro obligatorio de la autorización para el tratamiento de datos antes de crear un beneficiario.
- Los reportes se presentan de forma agregada, sin nombres ni documentos.
- El campo de tipo de población cubre explícitamente a personas migrantes, refugiadas, desplazadas, víctimas del conflicto armado y comunidades de acogida, además de registrar discapacidad, para reflejar la diversidad del territorio de Urabá.

## Componentes complementarios implementados

Priorizados solo después de que el flujo obligatorio quedó completo, conforme a la guía:

- **Acceso y roles**: descrito arriba (Funcionario/Administrador, gate por `proxy.ts`).
- **Sección pública**: landing, galería del proyecto y logos de aliados/financiadores visibles sin autenticación.
- **Inteligencia artificial**: asistente de IA (`components/AiAssistant.tsx`), widget de chat flotante disponible solo con sesión iniciada. Responde preguntas en lenguaje natural usando **exclusivamente indicadores agregados** (`lib/reportes.ts` → `obtenerDatosReporte`/`obtenerSerieTemporal`) — nunca nombres, documentos ni teléfonos; ver `tests/roles/role-agent.test.ts` (caso 3.3) para la aserción automatizada de esa regla.
- **Exportación**: `/reportes/export` genera un CSV con los mismos indicadores agregados que se ven en pantalla (nunca filas individuales de personas).
- **Gráficos dinámicos**: `components/GraficoIngresosBeneficiarios.tsx` — curva de registros/atenciones por semana, últimos 3/6 meses o último año, calculada con `date_trunc` en Postgres.

Fuera de alcance (no implementado): accesibilidad ampliada más allá de lo cubierto por defecto (contraste de color y navegación por teclado nativos de HTML/Tailwind).
