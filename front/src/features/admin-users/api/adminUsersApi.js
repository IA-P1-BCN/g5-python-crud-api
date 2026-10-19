// Axios calls: list users, deactivate, change role. No React, no mapping. Admin only (API_CONTRACT: Users).
import { api } from '@/shared/api/client.js'

// GET /users is paginated: { items, total, page, size }.
export async function fetchUsers({ page = 1, size = 20 } = {}) {
  const { data } = await api.get('/users', { params: { page, size } })
  return data
}

// PUT /users/:id/deactivate. 409 LAST_ADMIN when it is the last active admin (BR-A5).
export async function deactivateUser(id) {
  const { data } = await api.put(`/users/${id}/deactivate`)
  return data
}

// PUT /users/:id/role. Body: { role: 'client' | 'staff' | 'admin' }. 409 LAST_ADMIN when demoting the last admin.
export async function changeUserRole(id, role) {
  const { data } = await api.put(`/users/${id}/role`, { role })
  return data
}
