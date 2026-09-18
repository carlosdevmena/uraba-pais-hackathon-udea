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
    <header className="sticky top-0 z-10 border-b border-black/10 bg-header/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-8 lg:px-12 xl:px-16">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white ring-2 ring-white/60">
            <Image src="/brand-icon.png" alt="URABÁ-PAÍS" width={32} height={32} className="h-6 w-6 object-contain" />
          </span>
          <span className="font-semibold tracking-tight text-brand-900">URABÁ-PAÍS</span>
        </Link>
        <nav
          className={`flex min-w-0 gap-1 overflow-x-auto rounded-full border border-white/40 bg-white/50 p-1 text-sm font-medium text-brand-900 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-100 ${
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
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition sm:px-3.5 ${
                  isActive
                    ? "bg-white text-brand-800 shadow-sm dark:bg-slate-800 dark:text-brand-200"
                    : "hover:text-brand-700 dark:hover:text-white"
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
              <span className="hidden rounded-full bg-white/60 px-2.5 py-1 text-xs font-medium text-brand-900 sm:inline dark:bg-slate-800/70 dark:text-mint-300">
                {ETIQUETA_ROL[rol]}
              </span>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/30 px-2.5 py-1.5 text-xs font-medium text-brand-900 transition hover:bg-white/60 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-100 dark:hover:bg-slate-800"
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
