// Booking flow texts. (Spanish). One file per feature: no conflicts.
export default {
  title: 'Selecciona fecha y hora',
  selectDate: 'Elige un día',
  selectTime: 'Horarios',
  loadingSlots: 'Cargando horarios...',
  noSlotsAvailable: 'No hay horarios disponibles para esta fecha.',
  states: {
    free: 'Disponible',
    taken: 'Ocupado',
    blocked: 'Bloqueado',
    past: 'Pasado',
  },
  errors: {
    loadFailed: 'No se pudieron cargar los horarios disponibles.',
    nameRequired: 'Escribe tu nombre.',
    nameTooLong: 'El nombre no puede superar los 100 caracteres.',
    emailInvalid: 'Escribe un email válido.',
    phoneInvalid: 'El teléfono solo puede tener números, espacios y + - ( ).',
  },
  selectedSlot: 'Horario seleccionado',
  ticket: {
    players: 'Jugadores',
    pricePerPlayer: 'Precio por jugador',
    total: 'Total',
  },
  checkout: {
    title: 'Tu reserva',
    players: 'Número de jugadores',
    name: 'Nombre',
    email: 'Email',
    phone: 'Teléfono (opcional)',
    submit: 'Confirmar reserva',
  },
}
