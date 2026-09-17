-- Refuerzo a nivel de base de datos (además de la validación en la app):
-- impide dos participaciones activas (inscrito o en_proceso) del mismo
-- beneficiario en el mismo programa. Prisma no soporta índices únicos
-- parciales de forma declarativa, por eso se aplica con SQL crudo.
CREATE UNIQUE INDEX IF NOT EXISTS participacion_activa_unica
ON "Participacion" ("beneficiarioId", "programaId")
WHERE estado IN ('inscrito', 'en_proceso');
