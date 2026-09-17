import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormPageHeader } from "@/components/ui";
import NuevoSeguimientoForm from "./NuevoSeguimientoForm";

export const dynamic = "force-dynamic";

export default async function NuevoSeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beneficiario = await prisma.beneficiario.findUnique({
    where: { id },
    select: { id: true, nombres: true, codigoInterno: true },
  });
  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <FormPageHeader
        beneficiarioId={beneficiario.id}
        codigoInterno={beneficiario.codigoInterno}
        nombres={beneficiario.nombres}
        titulo="Añadir seguimiento"
      />
      <NuevoSeguimientoForm beneficiarioId={beneficiario.id} />
    </div>
  );
}
