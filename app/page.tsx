import Link from "next/link";
import Image from "next/image";
import { UserPlus, Search, LogIn } from "lucide-react";
import { buttonPrimary, buttonSecondary, card } from "@/components/ui";
import GaleriaProyecto from "@/components/GaleriaProyecto";
import FlujoCiclo from "@/components/FlujoCiclo";
import Reveal from "@/components/Reveal";
import { obtenerRolActivo } from "@/app/login/actions";

export default async function Home() {
  const rol = await obtenerRolActivo();

  return (
    <div className="flex flex-col gap-10">
      <section className={`${card} relative overflow-hidden p-8 sm:p-12`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-900/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/70 blur-3xl dark:bg-accent-600/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-700">
              Hackathon Proyecto URABÁ-PAÍS
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Gestión y seguimiento de beneficiarios
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Prototipo funcional para registrar personas, vincularlas a programas, registrar
              atenciones o ayudas, hacer seguimiento y consultar reportes — con datos
              completamente ficticios.
            </p>
            {rol ? (
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
            ) : (
              <div className="mt-6">
                <Link href="/login" className={buttonPrimary}>
                  <LogIn size={16} />
                  Iniciar sesión para gestionar beneficiarios
                </Link>
              </div>
            )}
          </div>
          <div className="relative hidden h-56 w-72 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-mint-50 to-brand-50 shadow-lg ring-4 ring-white transition-transform duration-300 hover:scale-[1.02] lg:flex dark:ring-slate-800">
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

      <Reveal>
        <GaleriaProyecto />
      </Reveal>

      <Reveal retraso={100}>
        <section className={`${card} flex flex-col items-center gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-center lg:gap-10`}>
          <div className="self-start lg:self-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Flujo del sistema
            </p>
            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Un ciclo continuo: cada beneficiario pasa por registro, vinculación, atención y
              seguimiento — y vuelve a empezar en cada nuevo servicio.
            </p>
          </div>
          <FlujoCiclo />
        </section>
      </Reveal>
    </div>
  );
}
