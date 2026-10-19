import { api } from '@/shared/api/client.js'

export async function fetchUsers({ page = 1, size = 20 } = {}) {
  const { data } = await api.get('/users', { params: { page, size } })
  return data
}

export async function deactivateUser(id) {
  const { data } = await api.put(`/users/${id}/deactivate`)
  return data
}

export async function changeUserRole(id, role) {
  const { data } = await api.put(`/users/${id}/role`, { role })
  return data
}
