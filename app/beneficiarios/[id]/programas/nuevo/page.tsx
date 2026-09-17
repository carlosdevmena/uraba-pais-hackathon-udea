import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormPageHeader } from "@/components/ui";
import NuevoProgramaForm from "./NuevoProgramaForm";

export const dynamic = "force-dynamic";

export default async function NuevoProgramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [beneficiario, programas] = await Promise.all([
    prisma.beneficiario.findUnique({
      where: { id },
      select: { id: true, nombres: true, codigoInterno: true },
    }),
    prisma.programa.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!beneficiario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <FormPageHeader
        beneficiarioId={beneficiario.id}
        codigoInterno={beneficiario.codigoInterno}
        nombres={beneficiario.nombres}
        titulo="Vincular a un programa"
      />
      <NuevoProgramaForm beneficiarioId={beneficiario.id} programas={programas} />
    </div>
  );
}
