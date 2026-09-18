"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { card, buttonPrimary, inputClass } from "@/components/ui";
import { iniciarSesionManual, type LoginManualState } from "./actions";

const PASSWORD_PATTERN = "(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}";

const initialState: LoginManualState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(iniciarSesionManual, initialState);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-4">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-800 hover:underline dark:text-brand-300"
      >
        <ArrowLeft size={15} />
        Volver
      </Link>

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-700">
          URABÁ-PAÍS
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Acceso institucional para el equipo de gestión de beneficiarios.
        </p>
      </div>

      <section className={`${card} p-6`}>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Correo institucional</h2>
        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Correo</span>
            <input type="email" name="correo" required className={inputClass} placeholder="nombre@urabapais.org" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Contraseña</span>
            <input
              type="password"
              name="clave"
              required
              pattern={PASSWORD_PATTERN}
              title="Mínimo 8 caracteres, con al menos una mayúscula, un número y un símbolo."
              className={inputClass}
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Mínimo 8 caracteres, una mayúscula, un número y un símbolo.
            </span>
          </label>
          {state.error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{state.error}</p>}
          <button type="submit" disabled={pending} className={buttonPrimary}>
            <LogIn size={16} />
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </div>
  );
}
