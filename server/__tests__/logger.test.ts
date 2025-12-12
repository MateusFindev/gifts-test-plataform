import { describe, it, expect } from "vitest";
import { logger } from "../_core/logger";

describe("logger", () => {
  it("expõe os métodos básicos sem lançar erro", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    logger.debug("teste debug");
    logger.info("teste info");
    logger.warn("teste warn");
    logger.error("teste error");
  });
});
