"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, Users, UserPlus, BarChart3 } from "lucide-react";

const LINKS = [
  { href: "/beneficiarios", label: "Beneficiarios", icon: Users },
  { href: "/beneficiarios/nuevo", label: "Nuevo registro", icon: UserPlus },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b-2 border-slate-300 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <HeartHandshake size={18} />
          </span>
          <span className="font-semibold tracking-tight text-slate-900">
            URABÁ-PAÍS <span className="hidden font-normal text-slate-400 sm:inline">· Beneficiarios</span>
          </span>
        </Link>
        <nav className="flex min-w-0 gap-1 overflow-x-auto rounded-full border border-slate-200 bg-slate-100/70 p-1 text-sm font-medium text-slate-600">
          {LINKS.map(({ href, label, icon: Icon }) => {
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
                  isActive ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "hover:text-slate-900"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
