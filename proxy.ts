import { NextRequest, NextResponse } from "next/server";
import { COOKIE_ROL, ROLES, type Rol } from "@/app/login/roles";

/**
 * Gate de acceso por rol (chequeo optimista, solo lee la cookie — ver guía
 * de autenticación de Next.js). Funcionario y Administrador comparten
 * `/beneficiarios*`; `/reportes*` (indicadores, auditoría, exportación) es
 * exclusivo de Administrador, según la matriz de permisos del proyecto.
 */
function rolDesdeCookie(request: NextRequest): Rol | null {
  const valor = request.cookies.get(COOKIE_ROL)?.value;
  return (ROLES as readonly string[]).includes(valor ?? "") ? (valor as Rol) : null;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rol = rolDesdeCookie(request);

  const esBeneficiarios = pathname.startsWith("/beneficiarios");
  const esReportes = pathname.startsWith("/reportes");

  if ((esBeneficiarios || esReportes) && !rol) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (esReportes && rol === "funcionario") {
    return NextResponse.redirect(new URL("/beneficiarios", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|brand-icon.png|.*\\.(?:png|jpe?g|svg|ico)$).*)"],
};
