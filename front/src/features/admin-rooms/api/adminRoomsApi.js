// Axios calls: create, edit, activate/deactivate rooms. No React, no mapping.
import { api } from "../../../shared/api/client.js";

export const adminRoomsApi = {
  async getRooms() {
    const { data } = await api.get("/rooms");
    return Array.isArray(data) ? data : data.items;
  },

  async createRoom(room) {
    const { data } = await api.post("/rooms", room);
    return data;
  },

  async updateRoom(id, room) {
    const { data } = await api.put(`/rooms/${id}`, room);
    return data;
  },

  async toggleRoomActive(id, active) {
    const action = active ? "activate" : "deactivate";
    const { data } = await api.put(`/rooms/${id}/${action}`);
    return data;
  },
};
