import { describe, expect, it } from "vitest";
import { generarTrigramas, normalizarTexto, similitudSorensenDice } from "./trigram";

describe("normalizarTexto", () => {
  it("quita tildes, pasa a minúsculas y colapsa espacios", () => {
    expect(normalizarTexto("  Andrés   Gómez! ")).toBe("andres gomez");
  });
});

describe("generarTrigramas", () => {
  it("genera trigramas con padding de borde", () => {
    expect(generarTrigramas("juan")).toEqual(["__j", "_ju", "jua", "uan", "an_"]);
  });

  it("retorna vacío para texto vacío", () => {
    expect(generarTrigramas("   ")).toEqual([]);
  });
});

describe("similitudSorensenDice", () => {
  it("caso exacto: score = 1.0", () => {
    expect(similitudSorensenDice("Carlos Palacios", "Carlos Palacios")).toBe(1);
  });

  it("typos comunes: score > 0.5 (suficiente para advertir posible duplicado)", () => {
    // Con esta variante de trigramas (padding __/_ y comparación case/acento-insensible),
    // "Jhon Gonzales" vs "John González" da ~0.57 — por encima del umbral de advertencia
    // (0.4) usado en buscarCoincidenciasDifusas, aunque no llegue a 0.6.
    const score = similitudSorensenDice("Jhon Gonzales", "John González");
    expect(score).toBeGreaterThan(0.5);
  });

  it("nombres invertidos: score > 0.5", () => {
    const score = similitudSorensenDice("Carlos Andrés Pérez", "Pérez Andrés Carlos");
    expect(score).toBeGreaterThan(0.5);
  });

  it("nombres completamente distintos: score bajo", () => {
    const score = similitudSorensenDice("Carlos Palacios", "María Restrepo");
    expect(score).toBeLessThan(0.35);
  });

  it("es simétrica: similitud(A,B) === similitud(B,A)", () => {
    const a = similitudSorensenDice("Andrea Ríos", "Andrea Rios");
    const b = similitudSorensenDice("Andrea Rios", "Andrea Ríos");
    expect(a).toBe(b);
  });
});
