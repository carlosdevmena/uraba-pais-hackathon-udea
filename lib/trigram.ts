/**
 * Búsqueda difusa por trigramas (3-grams) con similitud de Sørensen-Dice.
 * Implementación en TypeScript usada para pruebas unitarias y como referencia;
 * la búsqueda contra la base de datos usa la extensión `pg_trgm` de Postgres
 * (ver app/beneficiarios/actions.ts::buscarCoincidenciasDifusas), que aplica
 * el mismo concepto directamente en el motor con índice GIN para escalar a
 * miles de registros sin fuerza bruta en memoria.
 */

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar tildes/diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // quitar caracteres especiales
    .replace(/\s+/g, " ")
    .trim();
}

export function generarTrigramas(texto: string): string[] {
  const normalizado = normalizarTexto(texto);
  if (!normalizado) return [];
  const conPadding = `__${normalizado}_`;
  const trigramas: string[] = [];
  for (let i = 0; i <= conPadding.length - 3; i++) {
    trigramas.push(conPadding.slice(i, i + 3));
  }
  return trigramas;
}

/**
 * Coeficiente de Sørensen-Dice sobre los conjuntos de trigramas de A y B.
 * Similitud(A, B) = (2 * |A ∩ B|) / (|A| + |B|). Rango: 0.0 (nada en común) a 1.0 (idéntico).
 */
export function similitudSorensenDice(a: string, b: string): number {
  const trigramasA = generarTrigramas(a);
  const trigramasB = generarTrigramas(b);
  if (trigramasA.length === 0 || trigramasB.length === 0) return 0;

  const setA = new Set(trigramasA);
  const setB = new Set(trigramasB);
  let interseccion = 0;
  for (const t of setA) {
    if (setB.has(t)) interseccion++;
  }
  return (2 * interseccion) / (trigramasA.length + trigramasB.length);
}
