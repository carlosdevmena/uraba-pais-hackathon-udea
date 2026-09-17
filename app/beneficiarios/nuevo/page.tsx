import Link from "next/link";
import NuevoBeneficiarioForm from "./NuevoBeneficiarioForm";

export default function NuevoBeneficiarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Registrar beneficiario</h1>
        <p className="mt-1 text-sm text-slate-500">
          Antes de crear un registro nuevo, verifica primero en{" "}
          <Link href="/beneficiarios" className="text-blue-700 underline">
            Beneficiarios
          </Link>{" "}
          si la persona ya existe. Si el tipo y número de documento coinciden con un
          registro existente, el sistema abrirá la ficha existente en vez de duplicarla.
        </p>
      </div>
      <NuevoBeneficiarioForm />
    </div>
  );
}
