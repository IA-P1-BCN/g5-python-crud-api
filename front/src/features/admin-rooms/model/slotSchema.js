import { z } from 'zod';

export const slotSchema = z.object({
  startTime: z.string().min(1, 'El horario de inicio es obligatorio'),
  endTime: z.string().min(1, 'El horario de fin es obligatorio'),
  isBlocked: z.boolean().default(false),
});