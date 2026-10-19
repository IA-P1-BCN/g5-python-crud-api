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
    staff: 'Planning de hoy',
    adminRooms: 'Gestión de salas',
    login: 'Acceder',
    logout: 'Cerrar sesión',
  },
  errors: {
    UNAUTHORIZED: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
    FORBIDDEN: 'No tienes permiso para esta acción.',
    NOT_FOUND: 'No hemos encontrado lo que buscas.',
    VALIDATION_ERROR: 'Algún dato no es válido. Revisa el formulario.',
    BOOKING_LIMIT_REACHED: 'Has alcanzado el límite de reservas activas.',
    ROOM_HAS_BOOKINGS: 'No se puede desactivar la sala porque tiene reservas.',
    LAST_ADMIN: 'No puedes quitar al último administrador activo.',
    ROOM_INACTIVE: 'Esta sala no está activa.',
    USER_INACTIVE: 'Este usuario está inactivo.',
    INVALID_PLAYERS: 'El número de jugadores no es válido para esta sala.',
    SLOT_OVERLAP: 'La franja se solapa con otra existente de esta sala.',
    AUTH_UNAVAILABLE:
      'El servicio de autenticación no está disponible. Inténtalo de nuevo más tarde.',
    METHOD_NOT_ALLOWED: 'Esta acción no está permitida.',
    HTTP_ERROR: 'No se ha podido completar la solicitud. Inténtalo de nuevo.',
    NETWORK_ERROR:
      'No se ha podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
    unknown: 'No se ha podido completar la acción. Inténtalo de nuevo.',
  },
}
