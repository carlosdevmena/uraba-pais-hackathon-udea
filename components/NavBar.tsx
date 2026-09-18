"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Users, UserPlus, BarChart3, LogIn, LogOut } from "lucide-react";
import type { Rol } from "@/app/login/roles";
import { cerrarSesionDemo } from "@/app/login/actions";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/beneficiarios", label: "Consultar", icon: Users },
  { href: "/beneficiarios/nuevo", label: "Nuevo registro", icon: UserPlus },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

const ETIQUETA_ROL: Record<Rol, string> = {
  funcionario: "Funcionario",
  administrador: "Administrador",
};

export default function NavBar({ rol }: { rol: Rol | null }) {
  const pathname = usePathname();
  const links = !rol ? [] : rol === "funcionario" ? LINKS.filter((l) => l.href !== "/reportes") : LINKS;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-900/5 bg-header/80 backdrop-blur-md transition-colors dark:border-white/10 dark:bg-slate-900/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-8 lg:px-12 xl:px-16">
        <Link href="/" className="flex shrink-0 items-center gap-2 transition hover:opacity-80">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-2 ring-brand-100 dark:ring-slate-700">
            <Image src="/brand-icon.png" alt="URABÁ-PAÍS" width={32} height={32} className="h-6 w-6 object-contain" />
          </span>
          <span className="font-semibold tracking-tight text-brand-800 dark:text-slate-100">URABÁ-PAÍS</span>
        </Link>
        <nav
          className={`flex min-w-0 gap-1 overflow-x-auto rounded-full border border-slate-200 bg-slate-100/70 p-1 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 ${
            links.length === 0 ? "hidden" : ""
          }`}
        >
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/beneficiarios"
                ? pathname === "/beneficiarios" ||
                  (pathname.startsWith("/beneficiarios/") && pathname !== "/beneficiarios/nuevo")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all sm:px-3.5 ${
                  isActive
                    ? "bg-white text-brand-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-brand-200 dark:ring-slate-600"
                    : "hover:bg-white/60 hover:text-brand-700 dark:hover:bg-slate-700/60 dark:hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {rol ? (
            <form action={cerrarSesionDemo} className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full bg-mint-50 px-2.5 py-1 text-xs font-medium text-mint-700 sm:inline dark:bg-mint-700/20 dark:text-mint-300">
                {ETIQUETA_ROL[rol]}
              </span>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-800"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
