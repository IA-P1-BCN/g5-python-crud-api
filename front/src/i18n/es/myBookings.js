export default {
  history: {
    title: 'Historial de partidas',
    loading: 'Cargando tu historial',
    loadError: 'No hemos podido cargar tu historial. Inténtalo de nuevo.',
    empty: 'Aún no has jugado ninguna partida.',
    escaped: 'Escapaste',
    failed: 'No escapaste',
    noResult: 'Resultado pendiente',
    time: 'Tiempo',
  },
  card: {
    players: 'Jugadores',
    total: 'Total',
    status: {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    },
  },
  tabs: {
    label: 'Filtrar reservas',
    upcoming: 'Próximas',
    past: 'Pasadas',
    cancelled: 'Canceladas',
    all: 'Todas',
  },
  page: {
    title: 'Mis reservas',
    loading: 'Cargando tus reservas',
    loadError: 'No hemos podido cargar tus reservas. Inténtalo de nuevo.',
    empty: 'No hay reservas en esta pestaña.',
  },
  errors: {
    tooLateToCancel: 'Ya no se puede cancelar: faltan menos de 24 horas.',
    tooLateToModify: 'Ya no se puede modificar: faltan menos de 24 horas.',
    invalidPlayers: 'El número de jugadores no es válido para esta sala.',
    slotTaken: 'Ese horario acaba de ser reservado. Elige otro.',
    slotNotAvailable: 'Ese horario ya no está disponible. Elige otro.',
    slotNotFound: 'Ese horario ya no existe. Elige otro.',
  },
  actions: {
    modify: 'Modificar jugadores',
    changeSlot: 'Cambiar horario',
    cancel: 'Cancelar reserva',
    tooLate: 'No se puede modificar ni cancelar con menos de 24 horas de antelación.',
  },
  cancelDialog: {
    title: 'Cancelar la reserva',
    description:
      '¿Seguro que quieres cancelar tu reserva en {room}? Esta acción no se puede deshacer.',
    confirm: 'Sí, cancelar',
    keep: 'Mantener reserva',
  },
  modifyDialog: {
    title: 'Modificar jugadores',
    description: 'Elige el número de jugadores para {room}.',
    save: 'Guardar',
  },
  changeSlotDialog: {
    title: 'Cambiar horario',
    description: 'Elige otro día y horario para {room}.',
    save: 'Cambiar horario',
  },
}
