import { Users, HeartHandshake, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { card } from "@/components/ui";

export const dynamic = "force-dynamic";

const ETIQUETAS_POBLACION: Record<string, string> = {
  migrante: "Migrante",
  refugiado: "Refugiado",
  desplazado: "Desplazado",
  victima_conflicto: "Víctima del conflicto",
  comunidad_acogida: "Comunidad de acogida",
  otro: "Otro",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  inscrito: "Inscrito",
  en_proceso: "En proceso",
  finalizado: "Finalizado",
  retirado: "Retirado",
};

function TarjetaIndicador({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string;
  valor: number | string;
  icon: typeof Users;
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center gap-2 text-slate-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={16} />
        </span>
        <p className="text-sm">{titulo}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{valor}</p>
    </div>
  );
}

function TablaDistribucion({
  titulo,
  filas,
}: {
  titulo: string;
  filas: { etiqueta: string; valor: number }[];
}) {
  const total = filas.reduce((acc, f) => acc + f.valor, 0) || 1;
  return (
    <div className={`${card} p-5`}>
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {filas.map((f) => (
          <div key={f.etiqueta} className="flex items-center gap-2 text-sm sm:gap-3">
            <span className="w-20 shrink-0 truncate text-slate-600 sm:w-40" title={f.etiqueta}>
              {f.etiqueta}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-50">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${(f.valor / total) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-medium text-slate-900">{f.valor}</span>
          </div>
        ))}
        {filas.length === 0 && <p className="text-sm text-slate-400">Sin datos aún.</p>}
      </div>
    </div>
  );
}

export default async function ReportesPage() {
  const [
    beneficiariosUnicos,
    atencionesRegistradas,
    seguimientosPendientes,
    participacionesPorPrograma,
    participacionesPorEstado,
    beneficiariosPorPoblacion,
    programas,
  ] = await Promise.all([
    prisma.beneficiario.count(),
    prisma.atencion.count(),
    prisma.seguimiento.count({ where: { accionPendiente: { not: null } } }),
    prisma.participacion.groupBy({ by: ["programaId"], _count: { _all: true } }),
    prisma.participacion.groupBy({ by: ["estado"], _count: { _all: true } }),
    prisma.beneficiario.groupBy({ by: ["tipoPoblacion"], _count: { _all: true } }),
    prisma.programa.findMany(),
  ]);

  const nombrePrograma = new Map(programas.map((p) => [p.id, p.nombre]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reportes e indicadores</h1>
        <p className="mt-1 text-sm text-slate-500">
          Datos agregados, calculados en tiempo real a partir de la información registrada.
          No se muestran nombres ni documentos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaIndicador titulo="Beneficiarios únicos" valor={beneficiariosUnicos} icon={Users} />
        <TarjetaIndicador
          titulo="Atenciones o ayudas registradas"
          valor={atencionesRegistradas}
          icon={HeartHandshake}
        />
        <TarjetaIndicador
          titulo="Seguimientos con acción pendiente"
          valor={seguimientosPendientes}
          icon={ClipboardList}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TablaDistribucion
          titulo="Participaciones por programa"
          filas={participacionesPorPrograma.map((p) => ({
            etiqueta: nombrePrograma.get(p.programaId) ?? "Programa",
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Participaciones por estado"
          filas={participacionesPorEstado.map((p) => ({
            etiqueta: ETIQUETAS_ESTADO[p.estado] ?? p.estado,
            valor: p._count._all,
          }))}
        />
        <TablaDistribucion
          titulo="Beneficiarios por tipo de población"
          filas={beneficiariosPorPoblacion.map((p) => ({
            etiqueta: ETIQUETAS_POBLACION[p.tipoPoblacion] ?? p.tipoPoblacion,
            valor: p._count._all,
          }))}
        />
      </div>
    </div>
  );
}
