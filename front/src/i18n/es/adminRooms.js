export default {
  title: 'Gestión de Salas',
  createSuccess:
    'Sala creada con éxito. Los clientes la verán solo cuando tenga franjas horarias próximas asignadas (BR-R6).',
  duplicateSlug: 'Este slug ya existe (DUPLICATE)',

  slots: {
    title: 'Gestión de franjas horarias',
    loading: 'Cargando…',
    empty: 'Esta sala todavía no tiene franjas.',
    createSlot: 'Crear franja',
    table: { date: 'Fecha', start: 'Inicio', end: 'Fin', status: 'Estado', actions: 'Acciones' },
    status: { free: 'Disponible', taken: 'Reservada', blocked: 'Bloqueada', past: 'Pasada' },
    actions: { edit: 'Editar', block: 'Bloquear', unblock: 'Desbloquear', delete: 'Eliminar' },
    form: {
      date: 'Fecha',
      startTime: 'Hora de inicio',
      endTime: 'Hora de fin',
      save: 'Guardar',
      saving: 'Guardando…',
      cancel: 'Cancelar',
      errors: {
        required: 'Este campo es obligatorio.',
        invalidTime: 'Introduce una hora válida.',
        endBeforeStart: 'La hora de fin debe ser posterior a la de inicio.',
        startInPast: 'La franja no puede empezar en el pasado.',
      },
    },
    errors: {
      SLOT_OVERLAP: 'La franja se solapa con otra existente de esta sala.',
      SLOT_ACTIVE_BOOKING:
        'La franja tiene una reserva activa: no se puede editar, bloquear ni eliminar.',
      VALIDATION_ERROR: 'Los datos de la franja no son válidos.',
      SLOT_NOT_FOUND: 'La franja ya no existe.',
      FORBIDDEN: 'No tienes permisos para gestionar franjas.',
      UNAUTHORIZED: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
      UNKNOWN: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
    },
  },
}
