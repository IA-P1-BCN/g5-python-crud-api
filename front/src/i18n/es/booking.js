export default {
  title: 'Selecciona fecha y hora',
  selectDate: 'Elige un día',
  selectTime: 'Horarios',
  continue: 'Continuar',
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
    submitting: 'Procesando...',
    unspecified: 'No especificado',
    errors: {
      slotTaken:
        'El horario seleccionado ya no está disponible. Por favor, vuelve al paso anterior y selecciona otro.',
      unexpected: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
    },
  },
  confirmation: {
    title: '¡Reserva confirmada!',
    subtitle:
      'La transmisión ha sido asegurada. Te hemos enviado un correo con los detalles de acceso.',
    stamp: 'CONFIRMADO',
    ticket: {
      header: 'Pase de Acceso - F-Inmersivo',
      date: 'Fecha',
      time: 'Hora',
      bookingId: 'ID de reserva',
      holder: 'Titular',
      pending: 'PENDIENTE',
    },
    home: 'Volver al inicio',
  },
}
