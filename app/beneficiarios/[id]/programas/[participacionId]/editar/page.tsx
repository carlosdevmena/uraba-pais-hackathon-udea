import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormPageHeader } from "@/components/ui";
import EditarParticipacionForm from "./EditarParticipacionForm";

export const dynamic = "force-dynamic";

export default async function EditarParticipacionPage({
  params,
}: {
  params: Promise<{ id: string; participacionId: string }>;
}) {
  const { id, participacionId } = await params;
  const participacion = await prisma.participacion.findUnique({
    where: { id: participacionId },
    include: { beneficiario: { select: { id: true, nombres: true, codigoInterno: true } }, programa: true },
  });

  if (!participacion || participacion.beneficiario.id !== id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <FormPageHeader
        beneficiarioId={id}
        codigoInterno={participacion.beneficiario.codigoInterno}
        nombres={participacion.beneficiario.nombres}
        titulo={`Actualizar vinculación · ${participacion.programa.nombre}`}
      />
      <EditarParticipacionForm
        beneficiarioId={id}
        participacionId={participacion.id}
        estadoActual={participacion.estado}
      />
    </div>
  );
}
