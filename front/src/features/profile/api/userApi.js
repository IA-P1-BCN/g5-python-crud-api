import { api } from '@/shared/api/client.js'

export async function fetchProfile() {
  const { data } = await api.get('/users/me')
  return data
}

export async function updateProfile({ name, phone }) {
  const { data } = await api.put('/users/me', { name, phone: phone || null })
  return data
}

export async function fetchPlayerHistory() {
  const { data } = await api.get('/users/me/history')
  return data
}
