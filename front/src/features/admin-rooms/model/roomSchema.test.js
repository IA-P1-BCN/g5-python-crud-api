import { describe, it, expect } from "vitest";
import { roomSchema } from "./roomSchema";

describe("roomSchema", () => {
  it("validates a correct room object successfully", () => {
    const validData = {
      slug: "sala-misterio",
      genre: "Terror",
      capacity: 6,
      min_players: 2,
      difficulty: 3,
      hook: "Un misterio por resolver",
      story: "Historia detallada...",
      audience: "Todo público"
    };

    const result = roomSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when min_players exceeds capacity", () => {
    const invalidData = {
      slug: "sala-misterio",
      genre: "Terror",
      capacity: 4,
      min_players: 5,
      difficulty: 3,
      hook: "Hook",
      story: "Historia",
      audience: "Público"
    };

    const result = roomSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain("El mínimo de jugadores no puede superar la capacidad");
  });
});