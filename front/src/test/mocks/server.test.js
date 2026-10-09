import axios from 'axios'
import { http, HttpResponse } from 'msw'
import { server } from './server.js'

describe('MSW server', () => {
  it('is started by test/setup.js: an unhandled request fails the test', async () => {
    await expect(axios.get('http://localhost/api/v1/unknown')).rejects.toThrow()
  })

  it('lets a test override a handler with server.use()', async () => {
    server.use(http.get('http://localhost/api/v1/ping', () => HttpResponse.json({ ok: true })))
    const { data } = await axios.get('http://localhost/api/v1/ping')
    expect(data).toEqual({ ok: true })
  })

  it('resets the overrides after each test', async () => {
    await expect(axios.get('http://localhost/api/v1/ping')).rejects.toThrow()
  })
})
