import { z } from 'zod'
import es from '@/i18n/es.js'

const t = es.adminRooms.form.errors

// Inputs give strings. Check "empty" first: z.coerce.number() would turn '' into 0.
const int = (required, range, min, max) =>
  z
    .string()
    .trim()
    .min(1, required)
    .pipe(z.coerce.number().int(range).min(min, range).max(max, range))

const text = (required, tooLong) => z.string().trim().min(1, required).max(100, tooLong)

// Limits mirror back/app/schemas/room.py (RoomBase).
export const roomSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, t.slugRequired)
      .regex(/^(?=.*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*$/, t.slugFormat),
    name: z.string().trim().min(1, t.nameRequired).max(100, t.nameTooLong),
    genre: text(t.genreRequired, t.genreTooLong),
    duration: int(t.durationRequired, t.durationRange, 1, 600),
    base_price: z
      .string()
      .trim()
      .min(1, t.priceRequired)
      // max_digits=10, decimal_places=2 in the API: up to 8 integer digits and 2 decimals.
      .regex(/^-?\d{0,8}(\.\d{0,2})?$/, t.priceFormat)
      .pipe(z.coerce.number().min(0, t.priceMin)),
    capacity: int(t.capacityRequired, t.capacityRange, 1, 50),
    min_players: int(t.minPlayersRequired, t.minPlayersRange, 1, 50),
    difficulty: int(t.difficultyRequired, t.difficultyRange, 1, 5),
    hook: z.string().trim().min(1, t.hookRequired).max(500, t.hookTooLong),
    story: z.string().trim().min(1, t.storyRequired).max(5000, t.storyTooLong),
    audience: text(t.audienceRequired, t.audienceTooLong),
  })
  .refine((d) => d.min_players <= d.capacity, {
    message: t.minPlayersOverCapacity,
    path: ['min_players'],
  })

export default roomSchema
