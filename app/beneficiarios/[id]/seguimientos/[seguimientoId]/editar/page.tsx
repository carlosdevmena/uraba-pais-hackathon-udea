import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormPageHeader } from "@/components/ui";
import EditarSeguimientoForm from "./EditarSeguimientoForm";

export const dynamic = "force-dynamic";

export default async function EditarSeguimientoPage({
  params,
}: {
  params: Promise<{ id: string; seguimientoId: string }>;
}) {
  const { id, seguimientoId } = await params;
  const seguimiento = await prisma.seguimiento.findUnique({
    where: { id: seguimientoId },
    include: { beneficiario: { select: { id: true, nombres: true, codigoInterno: true } } },
  });

  if (!seguimiento || seguimiento.beneficiario.id !== id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <FormPageHeader
        beneficiarioId={id}
        codigoInterno={seguimiento.beneficiario.codigoInterno}
        nombres={seguimiento.beneficiario.nombres}
        titulo="Editar seguimiento"
      />
      <EditarSeguimientoForm
        beneficiarioId={id}
        seguimiento={{
          id: seguimiento.id,
          avanceNovedad: seguimiento.avanceNovedad,
          observacion: seguimiento.observacion,
          accionPendiente: seguimiento.accionPendiente,
          proximoContacto: seguimiento.proximoContacto?.toISOString().slice(0, 10) ?? "",
          fecha: seguimiento.fecha.toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
