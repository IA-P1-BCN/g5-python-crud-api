import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { adminRoomsRoutes } from '@/features/admin-rooms'
import { adminStatsRoutes } from '@/features/admin-stats'
import { adminUsersRoutes } from '@/features/admin-users'
import { authRoutes } from '@/features/auth'
import { bookingRoutes } from '@/features/booking'
import { myBookingsRoutes } from '@/features/my-bookings'
import { profileRoutes } from '@/features/profile'
import { roomsRoutes } from '@/features/rooms'
import { staffRoutes } from '@/features/staff'
import AppRoutes from './routes.jsx'

describe('each feature owns its routes', () => {
  it.each([
    ['rooms', roomsRoutes],
    ['booking', bookingRoutes],
    ['my-bookings', myBookingsRoutes],
    ['auth', authRoutes],
    ['profile', profileRoutes],
    ['staff', staffRoutes],
    ['admin-rooms', adminRoomsRoutes],
    ['admin-users', adminUsersRoutes],
    ['admin-stats', adminStatsRoutes],
  ])('%s exports a routes array', (_name, routes) => {
    expect(Array.isArray(routes)).toBe(true)
  })
})

it('app routes still render the home page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: 'Escape rooms' })).toBeInTheDocument()
})
