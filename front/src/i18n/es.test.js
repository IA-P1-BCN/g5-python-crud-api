import es from './es.js'

it('has one namespace per feature plus common', () => {
  expect(Object.keys(es).sort()).toEqual(
    [
      'adminRooms',
      'adminStats',
      'adminUsers',
      'auth',
      'booking',
      'common',
      'myBookings',
      'profile',
      'rooms',
      'staff',
    ].sort(),
  )
})
