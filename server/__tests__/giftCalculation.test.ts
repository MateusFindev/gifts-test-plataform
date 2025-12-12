import { describe, it, expect } from "vitest";
import { calculateGifts } from "../giftCalculation";
import gifts from "../../shared/gifts.json";

const ALL_GIFTS = gifts as string[];

describe("calculateGifts", () => {
  it("retorna estrutura básica com arrays de dons", () => {
    const selfAnswers = new Array(180).fill(0);

    const result = calculateGifts(selfAnswers, undefined, undefined);

    expect(result).toBeDefined();
    expect(Array.isArray(result.manifestGifts)).toBe(true);
    expect(Array.isArray(result.latentGifts)).toBe(true);
  });

  it("nunca retorna mais que 5 dons manifestos ou latentes", () => {
    const selfAnswers = new Array(180).fill(3);

    const result = calculateGifts(selfAnswers, undefined, undefined);

    expect(result.manifestGifts.length).toBeLessThanOrEqual(5);
    expect(result.latentGifts.length).toBeLessThanOrEqual(5);
  });

  it("sempre retorna apenas dons válidos presentes em gifts.json", () => {
    const selfAnswers = new Array(180).fill(2);

    const result = calculateGifts(selfAnswers, undefined, undefined);

    for (const g of result.manifestGifts) {
      expect(ALL_GIFTS).toContain(g);
    }
    for (const g of result.latentGifts) {
      expect(ALL_GIFTS).toContain(g);
    }
  });
});
