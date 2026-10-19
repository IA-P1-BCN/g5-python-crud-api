// Roles from lowest to highest. A higher role can do everything a lower one can.
export const ROLES = ['client', 'staff', 'admin']

// True when userRole is at least `required` (staff passes for 'client'; admin passes for 'staff').
// Unknown or missing roles never pass, so a typo in a guard fails closed.
export function hasRole(userRole, required) {
  const have = ROLES.indexOf(userRole)
  const need = ROLES.indexOf(required)
  return have !== -1 && need !== -1 && have >= need
}

// Where a user lands after login or sign-up: staff and admin open today's planning, clients the rooms.
export const homeFor = (role) => (hasRole(role, 'staff') ? '/staff' : '/salas')
