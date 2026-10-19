import es from './es.js'

it('has one namespace per feature plus common', () => {
  expect(Object.keys(es).sort()).toEqual(
    [
      'adminRooms',
      'adminUsers',
      'auth',
      'booking',
      'common',
      'dashboard',
      'myBookings',
      'profile',
      'rooms',
      'staff',
    ].sort(),
  )
})
