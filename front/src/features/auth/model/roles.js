export const ROLES = ['client', 'staff', 'admin']

export function hasRole(userRole, required) {
  const have = ROLES.indexOf(userRole)
  const need = ROLES.indexOf(required)
  return have !== -1 && need !== -1 && have >= need
}

export const homeFor = (role) => (hasRole(role, 'staff') ? '/staff' : '/salas')
