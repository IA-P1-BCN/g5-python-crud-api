// Shared texts (buttons, generic errors). (Spanish). One file per feature: no conflicts.

export default {
  close: 'Cerrar',
  loading: 'Cargando',
  previous: 'Anterior',
  next: 'Siguiente',
  pagination: 'Paginación',
  pageOf: (page, pages) => `Página ${page} de ${pages}`,
  nav: {
    label: 'Navegación principal',
    rooms: 'Salas',
    myBookings: 'Mis reservas',
    history: 'Historial',
    profile: 'Perfil',
    staff: 'Planning de hoy',
    adminRooms: 'Gestión de salas',
    adminUsers: 'Usuarios',
    adminStats: 'Estadísticas',
    login: 'Acceder',
    logout: 'Cerrar sesión',
  },
  errors: {
    UNAUTHORIZED: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
    FORBIDDEN: 'No tienes permiso para esta acción.',
    NOT_FOUND: 'No hemos encontrado lo que buscas.',
    VALIDATION_ERROR: 'Algún dato no es válido. Revisa el formulario.',
    unknown: 'No se ha podido completar la acción. Inténtalo de nuevo.',
  },
}
