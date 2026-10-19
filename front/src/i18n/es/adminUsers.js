export default {
  title: 'Gestión de usuarios',
  empty: 'Todavía no hay usuarios.',
  table: {
    label: 'Usuarios',
    name: 'Nombre',
    email: 'Correo',
    role: 'Rol',
    status: 'Estado',
    actions: 'Acciones',
  },
  roleLabel: (name) => `Rol de ${name}`,
  roles: {
    client: 'Cliente',
    staff: 'Staff',
    admin: 'Administrador',
  },
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
  },
  deactivate: 'Desactivar',
  errors: {
    LAST_ADMIN: 'No puedes quitar al último administrador activo.',
    NOT_FOUND: 'Este usuario ya no existe.',
    unknown: 'No se ha podido completar la acción. Inténtalo de nuevo.',
  },
}
