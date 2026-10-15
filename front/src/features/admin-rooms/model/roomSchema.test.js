import { describe, it, expect } from "vitest"
import { roomSchema } from "./roomSchema"
import { slotSchema } from './slotSchema';

describe("roomSchema", () => {
  it("validates a correct room object successfully", () => {
    const validData = {
      slug: "sala-misterio",
      name: "Sala Misterio",
      genre: "Terror",
      duration: 60,
      base_price: 50,
      capacity: 6,
      min_players: 2,
      difficulty: 3,
      hook: "Un misterio por resolver",
      story: "Historia detallada...",
      audience: "Todo público"
    }

    const result = roomSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("fails when min_players exceeds capacity", () => {
    const invalidData = {
      slug: "sala-misterio",
      name: "Sala Misterio",
      genre: "Terror",
      duration: 60,
      base_price: 50,
      capacity: 4,
      min_players: 5,
      difficulty: 3,
      hook: "Hook",
      story: "Historia",
      audience: "Público"
    }

    const result = roomSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toContain("El mínimo de jugadores no puede superar la capacidad")
  })
})

describe('slotSchema', () => {
  it('validates a correct slot object', () => {
    const result = slotSchema.safeParse({ startTime: '09:00', endTime: '10:00', isBlocked: false });
    expect(result.success).toBe(true);
  });

  it('fails when start or end time is missing', () => {
    const result = slotSchema.safeParse({ startTime: '', endTime: '' });
    expect(result.success).toBe(false);
  });
});