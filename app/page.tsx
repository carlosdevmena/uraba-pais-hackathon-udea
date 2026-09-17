import Link from "next/link";
import { UserPlus, Search, BarChart3, ClipboardCheck, Link2, HeartHandshake } from "lucide-react";
import { buttonPrimary, buttonSecondary, card } from "@/components/ui";

const PASOS = [
  {
    titulo: "1. Registro",
    texto: "Buscar o registrar a la persona y su familia.",
    icon: UserPlus,
  },
  {
    titulo: "2. Vinculación",
    texto: "Asociarla a uno o varios programas.",
    icon: Link2,
  },
  {
    titulo: "3. Atención o ayuda",
    texto: "Registrar lo que se entregó o realizó.",
    icon: HeartHandshake,
  },
  {
    titulo: "4. Seguimiento",
    texto: "Registrar avances y acciones pendientes.",
    icon: ClipboardCheck,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <section className={`${card} relative overflow-hidden p-8 sm:p-12`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
              Hackathon Proyecto URABÁ-PAÍS
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Gestión y seguimiento de beneficiarios
            </h1>
            <p className="mt-3 text-slate-600">
              Prototipo funcional para registrar personas, vincularlas a programas, registrar
              atenciones o ayudas, hacer seguimiento y consultar reportes — con datos
              completamente ficticios, siguiendo el flujo Registro → Vinculación → Atención o
              ayuda → Seguimiento → Reporte.
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
              <Link href="/reportes" className={buttonSecondary}>
                <BarChart3 size={16} />
                Ver reportes
              </Link>
            </div>
          </div>
          <div className="hidden shrink-0 items-center justify-center rounded-2xl bg-blue-600/5 p-6 lg:flex">
            {/* Placeholder para ilustración/logo del proyecto — reemplazar con imagen real */}
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-blue-100">
              <HeartHandshake size={56} className="text-blue-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ titulo, texto, icon: Icon }) => (
          <div key={titulo} className={`${card} p-5`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={18} />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-slate-900">{titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{texto}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
