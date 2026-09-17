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

## Tipos de usuario propuestos

El inicio de sesión y los permisos son un componente **complementario** según la guía oficial y no se implementaron en esta versión del prototipo, priorizando el flujo obligatorio. Se proponen dos tipos de usuario para una siguiente iteración:

| Tipo de usuario | Qué vería |
|---|---|
| **Administrador** | Acceso completo: todos los módulos, incluidos los reportes agregados de todas las líneas de trabajo y la gestión del catálogo de programas. |
| **Funcionario** | Registro y consulta de beneficiarios, familiares, vinculaciones, atenciones y seguimientos que le correspondan; sin acceso a reportes agregados globales ni a la gestión del catálogo de programas. |

Ninguno de los dos roles vería datos personales en pantallas públicas o reportes agregados; ambos verían la ficha consolidada solo dentro del flujo de atención autorizado.

## Protección de datos y enfoque inclusivo

- Todos los datos usados (seed y pruebas) son ficticios; no se usa ninguna información real.
- Registro obligatorio de la autorización para el tratamiento de datos antes de crear un beneficiario.
- Los reportes se presentan de forma agregada, sin nombres ni documentos.
- El campo de tipo de población cubre explícitamente a personas migrantes, refugiadas, desplazadas, víctimas del conflicto armado y comunidades de acogida, además de registrar discapacidad, para reflejar la diversidad del territorio de Urabá.

## Componentes complementarios (no implementados, fuera del alcance mínimo)

Acceso y roles, sección pública, inteligencia artificial, exportación de reportes y accesibilidad ampliada — priorizados solo después de que el flujo obligatorio esté completo, conforme a la guía.
