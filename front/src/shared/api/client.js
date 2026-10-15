import axios from 'axios'

export const api = axios.create({ baseURL: '/api/v1' })

// shared must not import features, so the auth feature plugs itself in through these setters.
let getToken = null
let onUnauthorized = null

export function setAuthTokenGetter(fn) {
  getToken = fn
  return () => {
    if (getToken === fn) getToken = null
  }
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
  return () => {
    if (onUnauthorized === fn) onUnauthorized = null
  }
}

api.interceptors.request.use(async (config) => {
  const token = getToken ? await getToken() : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) onUnauthorized?.()
    return Promise.reject(error)
  },
)
