"use client";

import { useActionState } from "react";
import { LogIn, ShieldCheck, Users } from "lucide-react";
import { card, buttonPrimary, inputClass } from "@/components/ui";
import { iniciarSesionDemo, iniciarSesionManual, type LoginManualState } from "./actions";

const ACCESOS_DEMO = [
  {
    rol: "funcionario",
    titulo: "Funcionario",
    detalle: "Registro, búsqueda difusa y atenciones",
    correo: "funcionario@urabapais.org",
    clave: "Funcionario.2026*",
    icon: Users,
  },
  {
    rol: "administrador",
    titulo: "Administrador",
    detalle: "Gestión total, reportes y auditoría",
    correo: "admin@urabapais.org",
    clave: "Admin.2026*",
    icon: ShieldCheck,
  },
] as const;

const PASSWORD_PATTERN = "(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}";

const initialState: LoginManualState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(iniciarSesionManual, initialState);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-4">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-100">
          URABÁ-PAÍS
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acceso institucional para el equipo de gestión de beneficiarios.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${card} p-6`}>
          <h2 className="text-sm font-semibold text-slate-900">Correo institucional</h2>
          <form action={formAction} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Correo</span>
              <input type="email" name="correo" required className={inputClass} placeholder="nombre@urabapais.org" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Contraseña</span>
              <input
                type="password"
                name="clave"
                required
                pattern={PASSWORD_PATTERN}
                title="Mínimo 8 caracteres, con al menos una mayúscula, un número y un símbolo."
                className={inputClass}
              />
              <span className="text-xs text-slate-400">
                Mínimo 8 caracteres, una mayúscula, un número y un símbolo.
              </span>
            </label>
            {state.error && <p className="text-xs font-semibold text-rose-600">{state.error}</p>}
            <button type="submit" disabled={pending} className={buttonPrimary}>
              <LogIn size={16} />
              {pending ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>

        <section className={`${card} p-6`}>
          <h2 className="text-sm font-semibold text-slate-900">Acceso rápido para evaluadores / demo</h2>
          <p className="mt-1 text-xs text-slate-500">
            Un clic para autocompletar e ingresar con cada rol del sistema. Solo para fines de
            demostración: no reemplaza un mecanismo real de autenticación.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {ACCESOS_DEMO.map(({ rol, titulo, detalle, correo, clave, icon: Icon }) => (
              <form key={rol} action={iniciarSesionDemo}>
                <input type="hidden" name="rol" value={rol} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50/60 hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900">{titulo}</span>
                    <span className="block truncate text-xs text-slate-500">{detalle}</span>
                  </span>
                  <span className="hidden shrink-0 font-mono text-[11px] text-slate-400 sm:block">
                    {correo} · {clave}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
