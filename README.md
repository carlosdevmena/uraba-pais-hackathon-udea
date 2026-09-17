# URABÁ-PAÍS · Gestión de beneficiarios

Prototipo funcional para el registro, vinculación, atención y seguimiento de beneficiarios y sus familias — Hackathon Proyecto URABÁ-PAÍS (COOPI, FADV, HIAS, HI).

Flujo que implementa: **Registro → Vinculación → Atención o ayuda → Seguimiento → Reporte**, con todos los datos de ejemplo completamente ficticios.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript) — front y backend en un solo proyecto, usando Server Actions.
- [Prisma](https://www.prisma.io/) + PostgreSQL ([Supabase](https://supabase.com/)) como capa de datos.
- [Tailwind CSS](https://tailwindcss.com/) para estilos.

## Requisitos

- Node.js 20+
- Un proyecto de Supabase (o cualquier Postgres) con su cadena de conexión.

## Puesta en marcha local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar `DATABASE_URL` y `DIRECT_URL` con las cadenas de conexión de tu base de datos Postgres (en Supabase: **Project Settings → Database → Connection string**, pooler `6543` para `DATABASE_URL` y directa `5432` para `DIRECT_URL`).

   ```bash
   cp .env.example .env
   ```

3. Crear las tablas en la base de datos a partir del esquema de Prisma:

   ```bash
   npm run db:push
   ```

4. Sembrar datos ficticios de demostración (programas + beneficiarios de ejemplo):

   ```bash
   npm run db:seed
   ```

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

6. Abrir [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
app/
  page.tsx                     Landing / punto de entrada
  layout.tsx                   Navegación general
  beneficiarios/
    page.tsx                   Búsqueda y listado (Módulo 1)
    actions.ts                 Server actions: crear, buscar, vincular, registrar atención/seguimiento
    nuevo/                     Formulario de registro con regla anti-duplicados
    [id]/                      Ficha consolidada del beneficiario (Módulos 1-4)
  reportes/
    page.tsx                   Indicadores dinámicos (Módulo 4)
lib/
  prisma.ts                    Cliente Prisma singleton
prisma/
  schema.prisma                Modelo de datos
  seed.ts                      Datos ficticios de demostración
```

## Módulos obligatorios cubiertos

1. **Beneficiarios y familias**: registro, búsqueda, edición, relación con familiares, regla anti-duplicados por tipo + número de documento (`app/beneficiarios`).
2. **Programas y participación**: vincular a un beneficiario con uno o varios programas, con fecha y estado (`app/beneficiarios/[id]`).
3. **Atención y seguimiento**: registro de atenciones/ayudas y de seguimientos con avances y acciones pendientes (`app/beneficiarios/[id]`).
4. **Consultas y reportes**: ficha consolidada del beneficiario y página de indicadores dinámicos sin datos personales (`app/reportes`).

Ver [`docs/DESCRIPCION_SOLUCION.md`](./docs/DESCRIPCION_SOLUCION.md) para el detalle de arquitectura, estructura de datos y tipos de usuario propuestos.

## Datos

Todos los datos utilizados (seed y pruebas) son **ficticios**. No se usa ninguna información real de beneficiarios en el código, el repositorio ni la presentación.

## Despliegue

- **Base de datos**: Supabase (ya hospedada, no requiere despliegue adicional).
- **Aplicación**: Vercel. Conectar el repositorio y configurar `DATABASE_URL` y `DIRECT_URL` como variables de entorno del proyecto.
