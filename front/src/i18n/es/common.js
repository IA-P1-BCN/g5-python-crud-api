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
    history: 'Historial',
    profile: 'Perfil',
    myBookings: 'Mis reservas',
    adminUsers: 'Usuarios',
    staff: 'Planning de hoy',
    adminRooms: 'Gestión de salas',
    login: 'Acceder',
    logout: 'Cerrar sesión',
  },
  notFound: {
    title: 'Página no encontrada',
    description: 'La dirección que buscas no existe o ha cambiado.',
    back: 'Ir a las salas',
  },
  crash: {
    title: 'Algo ha salido mal',
    description: 'Ha ocurrido un error inesperado. Recarga la página para intentarlo de nuevo.',
    reload: 'Recargar',
  },
  errors: {
    UNAUTHORIZED: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
    FORBIDDEN: 'No tienes permiso para esta acción.',
    NOT_FOUND: 'No hemos encontrado lo que buscas.',
    VALIDATION_ERROR: 'Algún dato no es válido. Revisa el formulario.',
    unknown: 'No se ha podido completar la acción. Inténtalo de nuevo.',
  },
}
