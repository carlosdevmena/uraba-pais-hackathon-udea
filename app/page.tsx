import Link from "next/link";
import Image from "next/image";
import { UserPlus, Search, ClipboardCheck, Link2, HeartHandshake, ArrowRight } from "lucide-react";
import { buttonPrimary, buttonSecondary, card } from "@/components/ui";
import GaleriaProyecto from "@/components/GaleriaProyecto";

const PASOS = [
  { titulo: "Registro", icon: UserPlus },
  { titulo: "Vinculación", icon: Link2 },
  { titulo: "Atención o ayuda", icon: HeartHandshake },
  { titulo: "Seguimiento", icon: ClipboardCheck },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className={`${card} relative overflow-hidden p-8 sm:p-12`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-100">
              Hackathon Proyecto URABÁ-PAÍS
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Gestión y seguimiento de beneficiarios
            </h1>
            <p className="mt-3 text-slate-600">
              Prototipo funcional para registrar personas, vincularlas a programas, registrar
              atenciones o ayudas, hacer seguimiento y consultar reportes — con datos
              completamente ficticios.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/beneficiarios/nuevo" className={buttonPrimary}>
                <UserPlus size={16} />
                Registrar beneficiario
              </Link>
              <Link href="/beneficiarios" className={buttonSecondary}>
                <Search size={16} />
                Buscar / consultar
              </Link>
            </div>
          </div>
          <div className="relative hidden h-56 w-72 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-mint-50 to-brand-50 shadow-lg ring-4 ring-white lg:flex">
            <Image
              src="/hero-ilustracion.jpeg"
              alt="Ilustración de gestión y seguimiento de beneficiarios"
              fill
              className="object-contain p-4"
              priority
            />
          </div>
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Flujo del sistema</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {PASOS.map(({ titulo, icon: Icon }, i) => (
            <div key={titulo} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800 ring-1 ring-inset ring-brand-100">
                <Icon size={16} />
                {titulo}
              </span>
              {i < PASOS.length - 1 && <ArrowRight size={16} className="shrink-0 text-slate-300" />}
            </div>
          ))}
        </div>
      </section>

      <GaleriaProyecto />
    </div>
  );
}
