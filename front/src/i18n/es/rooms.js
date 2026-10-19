export default {
  welcome: 'Escape Rooms Barcelona',
  tagline: 'Elige una puerta del pasillo: cada sala esconde una historia distinta.',
  corridorLabel: 'Salas disponibles',
  enter: (name) => `Entrar en ${name}`,
  loading: 'Cargando salas…',
  loadError: 'No hemos podido cargar las salas. Inténtalo de nuevo más tarde.',
  empty: 'Ahora mismo no hay salas disponibles.',
  error: 'Error al cargar las salas disponibles.',
  notFound: 'Sala no encontrada',
  switchRoom: 'Sala',
  difficulty: (n) => `Dificultad ${n} de 5`,
  facts: (min, max, duration, price) =>
    `${min}-${max} jugadores · ${duration} min · ${price} / jugador`,
  reserve: 'Reservar',
  viewDetails: 'Ver sala',
  backToCorridor: 'Volver al corredor',
}
