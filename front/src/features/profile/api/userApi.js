// Axios calls: GET and PUT /users/me. No React, no mapping.
import { api } from '@/shared/api/client.js'

export async function fetchProfile() {
  const { data } = await api.get('/users/me')
  return data
}

// The API rejects unknown fields (422): send name and phone ONLY.
export async function updateProfile({ name, phone }) {
  // Empty input = no phone: send null, not "".
  const { data } = await api.put('/users/me', { name, phone: phone || null })
  return data
}

export async function fetchPlayerHistory() {
  const { data } = await api.get('/users/me/history')
  return data
}
