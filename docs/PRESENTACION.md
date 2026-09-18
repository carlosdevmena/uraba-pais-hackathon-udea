# Guion de presentación — URABÁ-PAÍS

Guion breve para la demostración ante el jurado. Duración sugerida: 6-8 minutos.

## 1. El problema (30 s)

Urabá (Apartadó, Turbo, Necoclí) atiende a población migrante, refugiada, desplazada, víctima del
conflicto armado y comunidades de acogida a través de tres organizaciones aliadas. Una misma
persona puede pasar por varios programas y recibir atención de distintos profesionales. Sin una
ficha única, el seguimiento se vuelve lento y no se puede responder con confianza quién fue
atendido, qué recibió y qué queda pendiente.

## 2. La idea central (30 s)

Un beneficiario = una ficha única con **código interno inmutable**. Todo lo que le pasa
(familiares, programas, atenciones, seguimientos) se cuelga de esa ficha, nunca se duplica a la
persona.

## 3. Demo en vivo — flujo obligatorio (3-4 min)

Usar el selector rápido de **Administrador** en `/login`.

1. **Registro** (`/beneficiarios/nuevo`): registrar una persona ficticia nueva con al menos un
   familiar (obligatorio). Mostrar el bloqueo visual y el mensaje en rojo si se deja un campo
   vacío.
2. **Duplicado exacto**: intentar registrar de nuevo con el mismo tipo+número de documento →
   el sistema avisa y enlaza a la ficha existente en vez de duplicar.
3. **Coincidencia difusa (sin documento)**: registrar sin documento un nombre parecido a uno ya
   existente → aviso de similitud por trigramas, con decisión final de una persona autorizada
   (checkbox de confirmación).
4. **Vinculación**: desde la ficha, vincular a un programa (estado: inscrito). Aclarar que
   **no es obligatorio al registrar** — puede hacerse en cualquier momento después.
5. **Atención y seguimiento**: registrar una atención y un seguimiento con acción pendiente y
   próxima fecha de contacto.
6. **Editar y finalizar seguimiento**: abrir el seguimiento recién creado, editarlo, y usar
   "Finalizar pendiente" para limpiarlo de la lista de pendientes. Si hay muchos seguimientos,
   mostrar "Ver historial completo" (paginado).
7. **Reporte**: ir a `/reportes` y mostrar que los indicadores (beneficiarios únicos,
   participaciones, atenciones, pendientes) se recalculan en tiempo real — nunca valores fijos —
   y que no se muestra ningún nombre ni documento.

## 4. Roles y acceso (1 min)

- Cerrar sesión y mostrar que `/beneficiarios` y `/reportes` redirigen a `/login` sin sesión
  (landing, galería y logos siguen siendo públicos).
- Entrar como **Funcionario**: tiene registro y consulta, pero no ve "Reportes" en el menú ni
  puede entrar por URL directa.
- Entrar como **Administrador**: acceso total, incluida la auditoría de consolidación.

## 5. Componentes complementarios (1-2 min)

- **Gráfico dinámico** en `/reportes`: cambiar entre semana / 3 meses / 6 meses / año y mostrar
  que la curva de registros y atenciones se recalcula con datos reales de Postgres.
- **Exportar CSV**: descargar el reporte agregado (abrir el archivo y mostrar que solo trae
  cifras, nunca beneficiarios individuales).
- **Asistente de IA**: abrir el chat flotante (solo visible con sesión iniciada) y preguntar en
  lenguaje natural, p. ej. "¿Cuál municipio concentra más beneficiarios?". Aclarar que el modelo
  solo recibe los mismos indicadores agregados que se ven en pantalla — nunca PII — y que sus
  respuestas son apoyo para la consulta, no una decisión institucional (límites de la sección
  10.1 de la guía oficial).

## 6. Calidad y confidencialidad (1 min)

- `npm test`: 22 pruebas automatizadas — roles/flujo, desempeño (`EXPLAIN ANALYZE` confirma que
  la búsqueda difusa por trigramas ejecuta en menos de 50 ms dentro de Postgres, sin contar la
  latencia de red), y una aserción específica de que los indicadores para el asistente de IA
  nunca incluyen nombres, documento ni teléfono.
- `node scripts/qa-test.mjs`: 13 casos de extremo a extremo con Playwright, incluida la
  verificación de que las rutas protegidas redirigen a `/login` sin sesión.
- La ficha de beneficiario (`/beneficiarios/[id]`) es **de solo lectura**: todas las mutaciones
  pasan por rutas `.../nuevo` o `.../editar` explícitas, con su propia validación.

## 7. Cierre (30 s)

Prototipo con los 4 módulos obligatorios completos y probados, más 6 componentes
complementarios (roles con bloqueo real, gráficos dinámicos, exportación, asistente de IA,
galería, accesibilidad básica), construido sobre datos completamente ficticios.

---

### Preguntas frecuentes que puede hacer el jurado

- **¿Por qué el login no verifica contraseñas contra una base de datos?** Porque la guía oficial
  define acceso y roles como componente complementario y no exige una tabla de usuarios; se
  priorizó el flujo obligatorio. El bloqueo de rutas por rol (`proxy.ts`) sí es real y se aplica
  en cada request, no solo en la interfaz.
- **¿Qué pasa si un beneficiario acumula muchos seguimientos?** La ficha muestra los 5 más
  recientes con un enlace a "Ver historial completo", que pagina de a 10 y permite filtrar solo
  los pendientes.
- **¿El asistente de IA puede filtrar datos personales?** No: solo recibe conteos agregados
  (`lib/reportes.ts`), nunca consulta nombres, documentos ni teléfonos; está cubierto por una
  prueba automatizada.
