import { describe, expect, it } from "vitest";
import { greet } from "./greet";

describe("greet", () => {
  it("greets a named person", () => {
    expect(greet("Ada")).toBe("Hello, Ada!");
  });

  it("falls back to world for blank names", () => {
    expect(greet("  ")).toBe("Hello, world!");
  });
});
