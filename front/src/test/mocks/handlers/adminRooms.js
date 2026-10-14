import { http, HttpResponse } from "msw";

const rooms = [
  { id: "1", slug: "room-one", genre: "Terror", capacity: 6, min_players: 2, difficulty: 4, hook: "Hook 1", story: "Story 1", audience: "Adults", active: true },
];

export const adminRoomsHandlers = [
  http.get("/api/v1/rooms", () => {
    return HttpResponse.json({ items: rooms, total: rooms.length, page: 1, size: 20 });
  }),
  http.post("/api/v1/rooms", async ({ request }) => {
    const body = await request.json();
    if (body.slug === "duplicate-slug") {
      return HttpResponse.json({ error: "DUPLICATE" }, { status: 400 });
    }
    const created = { id: String(rooms.length + 1), ...body, active: false };
    return HttpResponse.json(created, { status: 201 });
  }),
  http.put("/api/v1/rooms/:id/activate", ({ params }) => {
    const room = rooms.find((r) => r.id === params.id);
    if (room) room.active = true;
    return HttpResponse.json(room);
  }),
  http.put("/api/v1/rooms/:id/deactivate", ({ params }) => {
    const room = rooms.find((r) => r.id === params.id);
    if (room) room.active = false;
    return HttpResponse.json(room);
  }),
];

export default adminRoomsHandlers;
