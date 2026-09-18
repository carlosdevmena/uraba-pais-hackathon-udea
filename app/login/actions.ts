"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLES, COOKIE_ROL, type Rol } from "./roles";

const RUTA_POR_ROL: Record<Rol, string> = {
  funcionario: "/beneficiarios",
  administrador: "/beneficiarios",
};

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

async function setCookieSesion(rol: Rol) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_ROL, rol, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

/**
 * Acceso de demostración para jurado/evaluadores: no hay tabla de usuarios
 * en el schema (la guía oficial del hackathon permite que login/roles sean
 * un componente complementario). El rol queda en una cookie httpOnly que
 * `middleware.ts` usa para bloquear rutas según permisos.
 */
export async function iniciarSesionDemo(formData: FormData) {
  const rolRaw = String(formData.get("rol") ?? "");
  const rol = (ROLES as readonly string[]).includes(rolRaw) ? (rolRaw as Rol) : null;
  if (!rol) return;

  await setCookieSesion(rol);
  redirect(RUTA_POR_ROL[rol]);
}

export type LoginManualState = { error?: string };

/**
 * Formulario de correo/contraseña: valida complejidad de contraseña
 * (mínimo 8 caracteres, mayúscula, número y símbolo) e infiere el rol por
 * el prefijo del correo institucional, ya que no existe una tabla de
 * usuarios contra la cual verificar credenciales reales.
 */
export async function iniciarSesionManual(
  _prevState: LoginManualState,
  formData: FormData
): Promise<LoginManualState> {
  const correo = String(formData.get("correo") ?? "")
    .trim()
    .toLowerCase();
  const clave = String(formData.get("clave") ?? "");

  if (!PASSWORD_PATTERN.test(clave)) {
    return { error: "La contraseña debe tener 8+ caracteres, una mayúscula, un número y un símbolo." };
  }

  let rol: Rol | null = null;
  if (correo.startsWith("funcionario@")) rol = "funcionario";
  else if (correo.startsWith("admin@")) rol = "administrador";

  if (!rol) {
    return { error: "Correo no reconocido. Usa un correo institucional @urabapais.org válido." };
  }

  await setCookieSesion(rol);
  redirect(RUTA_POR_ROL[rol]);
}

export async function cerrarSesionDemo() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ROL);
  redirect("/login");
}

export async function obtenerRolActivo(): Promise<Rol | null> {
  const cookieStore = await cookies();
  const valor = cookieStore.get(COOKIE_ROL)?.value;
  return (ROLES as readonly string[]).includes(valor ?? "") ? (valor as Rol) : null;
}
