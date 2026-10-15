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
  },
  selectedSlot: 'Horario seleccionado',
}
