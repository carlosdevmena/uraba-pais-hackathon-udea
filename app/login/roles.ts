export const ROLES = ["funcionario", "administrador"] as const;
export type Rol = (typeof ROLES)[number];

export const COOKIE_ROL = "urabapais_role";
