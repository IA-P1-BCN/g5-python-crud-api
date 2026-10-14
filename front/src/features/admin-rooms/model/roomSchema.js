import { z } from "zod";

export const roomSchema = z.object({
  slug: z.string().min(1, "El slug es obligatorio").regex(/^[a-z0-9-]+$/, "Formato de slug inválido"),
  genre: z.string().optional(),
  capacity: z.number().min(1, "La capacidad mínima es 1").optional(),
  min_players: z.number().min(1, "Mínimo de jugadores debe ser al menos 1").optional(),
  difficulty: z.number().min(1).max(5, "La dificultad debe estar entre 1 y 5").optional(),
  hook: z.string().optional(),
  story: z.string().optional(),
  audience: z.string().optional()
}).refine((data) => data.min_players == null || data.capacity == null || data.min_players <= data.capacity, {
  message: "El mínimo de jugadores no puede superar la capacidad",
  path: ["min_players"]
});
