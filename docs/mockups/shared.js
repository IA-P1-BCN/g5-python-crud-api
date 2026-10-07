/* Shared content + behaviour for the three mockup skins (A, B, C).
   One markup, three looks: each HTML file only brings its own CSS.
   All copy is Spanish (Spanish escape room). All data is invented. */

const ROOMS = [
  { id: 'relojero', name: 'El Relojero', genre: 'Misterio victoriano', min: 2, max: 5, dur: 60, price: 22, diff: 2, active: true, aud: 'Para empezar y jugar en familia', rate: 68,
    hook: 'El maestro relojero desapareció. Su taller sigue sonando.',
    story: 'Londres, 1887. El maestro Aldous Vane lleva tres días sin salir de su taller y los relojes de la calle marcan horas distintas. Tenéis una hora para encontrar su rastro antes de que el último engranaje se detenga.' },
  { id: 'biblioteca', name: 'La Biblioteca Prohibida', genre: 'Fantasía oscura', min: 3, max: 6, dur: 75, price: 25, diff: 4, active: true, aud: 'Para jugadores con experiencia', rate: 31,
    hook: 'Un libro falta en el índice. Nadie admite haberlo tocado.',
    story: 'Los archivos de un monasterio guardan lo que la Iglesia nunca quiso leer en voz alta. Alguien arrancó una ficha del catálogo. Si el volumen se abre a medianoche, la biblioteca se cierra para siempre... con vosotros dentro.' },
  { id: 'faro', name: 'Faro 1923', genre: 'Terror marítimo', min: 2, max: 4, dur: 60, price: 20, diff: 3, active: true, aud: 'Para quien busca sustos', rate: 49,
    hook: 'El diario del farero se interrumpe a mitad de frase.',
    story: 'Cabo de Creus, una noche de temporal. El farero no responde por radio y la luz gira sola. Subid la escalera, leed su diario y apagad lo que lleva encendido desde hace cien años.' },
  { id: 'atraco', name: 'El Gran Atraco', genre: 'Robo y espionaje', min: 4, max: 8, dur: 90, price: 30, diff: 5, active: true, aud: 'Para equipos grandes y competitivos', rate: 22,
    hook: 'Una cámara acorazada, ocho minutos de ventana y cero errores.',
    story: 'El banco más vigilado de la ciudad guarda un cuadro que no figura en ningún inventario. Sois un equipo de especialistas: láseres, códigos y un guardia que da la ronda cada ocho minutos. Salid con el botín o no salgáis.' },
  { id: 'lab', name: 'Laboratorio Zero', genre: 'Ciencia ficción', min: 3, max: 5, dur: 60, price: 24, diff: 3, active: false,
    hook: 'Archivada.', story: '' }
];
const R = id => ROOMS.find(r => r.id === id);
const PUBLIC = ROOMS.filter(r => r.active);
const DAYS = [['Mié', 7], ['Jue', 8], ['Vie', 9], ['Sáb', 10], ['Dom', 11]];
const STATUS = { pend: 'Pendiente', conf: 'Confirmada', prog: 'En curso', done: 'Completada', canc: 'Cancelada' };
const eur = n => n.toLocaleString('es-ES') + ' €';

/* Slot times depend on the room duration (+30 min to reset the room). */
function times(r) {
  const step = r.dur + 30, out = [];
  for (let m = 10 * 60; m <= 20 * 60 + 30; m += step) out.push(String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
  return out;
}
/* Deterministic fake availability: past (today before 14:00), taken, blocked, free. */
function slotState(r, d, i, t) {
  if (d === 0 && t < '14:00') return 'past';
  const h = (ROOMS.indexOf(r) * 7 + d * 5 + i * 3) % 7;
  return h === 0 ? 'taken' : h === 4 ? 'blocked' : 'free';
}
function firstFree() {
  const r = R(S.room), ts = times(r);
  const t = ts.find((t, i) => slotState(r, S.day, i, t) === 'free');
  S.slot = t || null;
}

const S = {
  screen: 0, room: 'relojero', day: 0, slot: '16:00', players: 3, fPlayers: 0,
  bk: 'all', edit: 0, done: false, err: false, range: 'week',
  mine: [
    { id: 1, room: 'relojero', when: 'Vie 9 oct · 18:00', h: 56, p: 3, st: 'conf' },
    { id: 2, room: 'faro', when: 'Sáb 10 oct · 11:30', h: 72, p: 4, st: 'pend' },
    { id: 3, room: 'biblioteca', when: 'Hoy · 20:30', h: 8, p: 5, st: 'conf' },
    { id: 4, room: 'faro', when: 'Lun 28 sep · 16:00', h: -240, p: 2, st: 'done', res: 'Escapasteis en 47:12' },
    { id: 5, room: 'biblioteca', when: 'Dom 20 sep · 19:00', h: -400, p: 4, st: 'canc' }
  ],
  staff: [
    { t: '11:30', room: 'faro', who: 'Ana · 4', st: 'done', res: '41:08' },
    { t: '14:30', room: 'relojero', who: 'Tomás · 3', st: 'prog' },
    { t: '16:00', room: 'biblioteca', who: 'Lucía · 5', st: 'conf' },
    { t: '18:00', room: 'relojero', who: 'Marie · 3', st: 'pend' },
    { t: '20:00', room: 'atraco', who: 'Pablo · 6', st: 'conf' }
  ],
  rooms: Object.fromEntries(ROOMS.map(r => [r.id, r.active]))
};

const ART = {
  relojero: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="3"/><path d="M50 22v28l18 10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><g stroke="currentColor" stroke-width="2"><path d="M50 14v6M50 80v6M14 50h6M80 50h6"/></g></svg>',
  biblioteca: '<svg viewBox="0 0 100 100"><path d="M50 30C38 22 22 22 12 26v46c10-4 26-4 38 4 12-8 28-8 38-4V26c-10-4-26-4-38 4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M50 30v46" stroke="currentColor" stroke-width="3"/><circle cx="70" cy="16" r="4" fill="currentColor"/></svg>',
  faro: '<svg viewBox="0 0 100 100"><path d="M40 84l6-46h8l6 46z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M42 38h16l-2-10H44zM50 28v-8" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 40l24-6M86 40L62 34M16 52l22-4M84 52L62 48" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M10 88h80" stroke="currentColor" stroke-width="3"/></svg>',
  atraco: '<svg viewBox="0 0 100 100"><path d="M50 10l34 40-34 40-34-40z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M16 50h68M50 10v80" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 4"/><circle cx="50" cy="50" r="6" fill="currentColor"/></svg>',
  lab: '<svg viewBox="0 0 100 100"><path d="M40 12h20M44 12v28L22 80a6 6 0 005 9h46a6 6 0 005-9L56 40V12" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
};
const ICON = {
  lock: '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  trophy: '<svg class="ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
const dots = n => '<span class="diff" title="Dificultad ' + n + ' de 5">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= n ? 'on' : '') + '"></i>').join('') + '<em>' + ['', 'Fácil', 'Media-baja', 'Media', 'Difícil', 'Experto'][n] + '</em></span>';
const facts = r => '<div class="facts"><span>' + (r.min === r.max ? r.max : r.min + '–' + r.max) + ' jugadores</span><span>' + r.dur + ' min</span><span><b>' + r.price + ' €</b> / jugador</span></div>';
const badge = s => '<span class="badge s-' + s + '">' + STATUS[s] + '</span>';
const head = (t, l, extra = '') => '<div class="ph"><div><h1>' + t + '</h1><p class="lead">' + l + '</p></div>' + extra + '</div>';

const SCREENS = [
  { id: 'salas', group: 'Cliente', label: 'Salas' },
  { id: 'sala', group: 'Cliente', label: 'Sesiones' },
  { id: 'reserva', group: 'Cliente', label: 'Reserva' },
  { id: 'mis', group: 'Cliente', label: 'Mis reservas' },
  { id: 'perfil', group: 'Cliente', label: 'Mi perfil' },
  { id: 'staff', group: 'Staff', label: 'Hoy' },
  { id: 'admin', group: 'Admin', label: 'Panel' }
];

const V = {
  salas() {
    const chips = [0, 2, 3, 4, 5, 6, 8].map(n => '<button class="chip ' + (S.fPlayers === n ? 'on' : '') + '" onclick="A.fp(' + n + ')">' + (n ? n : 'Todos') + '</button>').join('');
    const cards = PUBLIC.map(r => {
      const ok = !S.fPlayers || (S.fPlayers >= r.min && S.fPlayers <= r.max);
      return '<article class="room-card ' + (ok ? '' : 'dim') + '" data-room="' + r.id + '"><div class="poster"><div class="art">' + ART[r.id] + '</div><span class="genre">' + r.genre + '</span></div>' +
        '<div class="body"><h2>' + r.name + '</h2><p class="hook">' + r.hook + '</p><p class="aud">' + r.aud + ' · ' + r.rate + ' % escapa</p>' + dots(r.diff) + facts(r) +
        (ok ? '<button class="cta" onclick="A.pick(\'' + r.id + '\')">Ver sesiones →</button>' : '<p class="hint">No admite ' + S.fPlayers + ' jugadores (' + r.min + '–' + r.max + ')</p>') + '</div></article>';
    }).join('');
    return head('Elige tu misión', 'Cuatro salas, una hora para escapar. Cada una con su propia historia.') +
      '<div class="filter"><span>¿Cuántos sois?</span><div class="chips">' + chips + '</div></div><div class="rooms">' + cards + '</div>';
  },

  sala() {
    const r = R(S.room), ts = times(r);
    const sw = PUBLIC.map(x => '<button class="chip ' + (x.id === S.room ? 'on' : '') + '" data-room="' + x.id + '" onclick="A.pick(\'' + x.id + '\',1)">' + x.name + '</button>').join('');
    const days = DAYS.map((d, i) => '<button class="chip day ' + (i === S.day ? 'on' : '') + '" onclick="A.day(' + i + ')"><small>' + d[0] + '</small>' + d[1] + '</button>').join('');
    const slots = ts.map((t, i) => {
      const s = slotState(r, S.day, i, t), cls = s === 'free' ? (S.slot === t ? 'sel' : '') : s;
      return '<button class="slot ' + cls + '" ' + (s === 'free' ? 'onclick="A.slot(\'' + t + '\')"' : 'disabled') + '>' + t + (s === 'free' ? '' : '<em>' + { taken: 'Ocupada', blocked: 'Cerrada', past: 'Pasada' }[s] + '</em>') + '</button>';
    }).join('');
    const free = S.slot !== null;
    return '<div class="roomswitch"><span>Sala</span><div class="chips">' + sw + '</div></div>' +
      '<div class="hero" data-room="' + r.id + '"><div class="fx"></div><div class="inner"><span class="genre">' + r.genre + '</span><h1>' + r.name + '</h1><p class="story">' + r.story + '</p>' + dots(r.diff) + facts(r) + '</div></div>' +
      '<div class="booker" data-room="' + r.id + '"><div class="step"><h3><b>1</b> Día</h3><div class="chips days">' + days + '</div></div>' +
      '<div class="step"><h3><b>2</b> Hora</h3><div class="slots">' + slots + '</div><p class="hint">Las sesiones ocupadas o cerradas no se pueden elegir.</p></div>' +
      '<div class="step"><h3><b>3</b> Jugadores</h3><div class="stepper"><button onclick="A.pl(-1)" ' + (S.players <= r.min ? 'disabled' : '') + '>−</button><strong>' + S.players + '</strong><button onclick="A.pl(1)" ' + (S.players >= r.max ? 'disabled' : '') + '>+</button><span>de ' + r.min + ' a ' + r.max + '</span></div></div>' +
      '<div class="sum"><div><span>' + (free ? DAYS[S.day][0] + ' ' + DAYS[S.day][1] + ' oct · ' + S.slot : 'Sin horas libres este día') + '</span><strong>' + eur(r.price * S.players) + '</strong><small>' + r.price + ' € × ' + S.players + ' jugadores</small></div>' +
      '<button class="cta" ' + (free ? '' : 'disabled') + ' onclick="A.go(2)">Reservar →</button></div></div>';
  },

  reserva() {
    const r = R(S.room);
    if (S.done) return head('¡Reserva registrada!', 'Te enviaremos un correo de confirmación.') +
      '<div class="alert ok"><b>' + r.name + '</b> · ' + DAYS[S.day][0] + ' ' + DAYS[S.day][1] + ' oct · ' + S.slot + ' · ' + S.players + ' jugadores<br>Estado: ' + badge('pend') + ' El personal la confirmará.</div>' +
      '<button class="cta" onclick="A.reset()">Volver a las salas</button>';
    return head('Confirma tu reserva', 'Último paso. Pagas en el local.') +
      '<div class="checkout" data-room="' + r.id + '"><form onsubmit="return false"><div class="field"><label>Nombre</label><input value="Marie Charlotte"></div>' +
      '<div class="field"><label>Correo electrónico</label><input value="charlotte@example.com"></div><div class="field"><label>Teléfono (opcional)</label><input placeholder="+34 …"></div>' +
      (S.err ? '<div class="alert err"><b>SLOT_TAKEN</b> · Alguien acaba de reservar esta sesión. Elige otra hora.</div>' : '') +
      '<p class="hint"><a href="#" onclick="A.fail();return false">Simular error: sesión ya reservada</a></p></form>' +
      '<aside class="ticket"><span class="genre">' + r.genre + '</span><h2>' + r.name + '</h2><p>' + DAYS[S.day][0] + ' ' + DAYS[S.day][1] + ' de octubre · ' + S.slot + '</p><p>' + S.players + ' jugadores × ' + r.price + ' €</p>' +
      '<strong class="total">' + eur(r.price * S.players) + '</strong><p class="hint">Cancelación gratuita hasta 24 h antes.</p><button class="cta" onclick="A.ok()">Confirmar reserva</button></aside></div>';
  },

  mis() {
    const f = { all: () => 1, next: b => b.h > 0 && b.st !== 'canc', past: b => b.h < 0 && b.st !== 'canc', canc: b => b.st === 'canc' }[S.bk];
    const chips = [['all', 'Todas'], ['next', 'Próximas'], ['past', 'Pasadas'], ['canc', 'Canceladas']].map(c => '<button class="chip ' + (S.bk === c[0] ? 'on' : '') + '" onclick="A.bk(\'' + c[0] + '\')">' + c[1] + '</button>').join('');
    const rows = S.mine.filter(f).map(b => {
      const r = R(b.room), live = b.st === 'pend' || b.st === 'conf', can = live && b.h >= 24, ed = S.edit === b.id;
      let act = '';
      if (can && ed) act = '<div class="stepper small"><button onclick="A.bp(' + b.id + ',-1)">−</button><strong>' + b.p + '</strong><button onclick="A.bp(' + b.id + ',1)">+</button></div><button class="btn" onclick="A.edit(0)">Guardar</button>';
      else if (can) act = '<button class="btn" onclick="A.edit(' + b.id + ')">Modificar jugadores</button><button class="btn ghost" onclick="A.cancel(' + b.id + ')">Cancelar</button>';
      else if (live) act = '<span class="hint lock">' + ICON.lock + ' Faltan menos de 24 h: ya no se puede cambiar</span>';
      else if (b.res) act = '<span class="hint">' + ICON.trophy + ' ' + b.res + '</span>';
      return '<article class="booking" data-room="' + b.room + '"><div class="when"><strong>' + b.when + '</strong></div><div class="what"><h3>' + r.name + '</h3><p>' + b.p + ' jugadores · ' + eur(r.price * b.p) + '</p></div>' + badge(b.st) + '<div class="acts">' + act + '</div></article>';
    }).join('') || '<p class="hint">No hay reservas en esta vista.</p>';
    return head('Mis reservas', 'Cambia el número de jugadores o cancela hasta 24 h antes.') + '<div class="chips filterbar">' + chips + '</div><div class="blist">' + rows + '</div>';
  },

  perfil() {
    return head('Mi perfil', 'Tus datos y tu marcador.') +
      '<div class="profile"><form onsubmit="return false"><div class="avatar">MC</div><div class="field"><label>Nombre</label><input value="Marie Charlotte"></div><div class="field"><label>Teléfono</label><input value="+34 600 000 000"></div>' +
      '<div class="field"><label>Correo (no se puede cambiar)</label><input value="charlotte@example.com" disabled></div><button class="cta" onclick="A.toast(this)">Guardar cambios</button></form>' +
      '<div class="score"><div><b>6</b><span>partidas</span></div><div><b>4</b><span>escapadas</span></div><div><b>47:12</b><span>mejor tiempo</span></div></div></div>';
  },

  staff() {
    const lab = { pend: ['Confirmar', 'conf'], conf: ['Iniciar', 'prog'], prog: ['Finalizar', 'done'] };
    const rows = S.staff.map((g, i) => {
      const a = lab[g.st];
      const act = a ? '<button class="btn" onclick="A.stf(' + i + ')">' + a[0] + '</button>' : g.res ? '<span class="hint">' + ICON.trophy + ' ' + g.res + '</span>' : '<button class="btn ghost" onclick="A.stf(' + i + ')">Registrar resultado</button>';
      return '<tr data-room="' + g.room + '"><td class="t">' + g.t + '</td><td>' + R(g.room).name + '</td><td>' + g.who + '</td><td>' + badge(g.st) + '</td><td>' + act + '</td></tr>';
    }).join('');
    return head('Partidas de hoy', 'Miércoles 7 de octubre · ' + S.staff.length + ' partidas') +
      '<table class="tbl"><thead><tr><th>Hora</th><th>Sala</th><th>Grupo</th><th>Estado</th><th></th></tr></thead><tbody>' + rows + '</tbody></table><p class="hint">Una partida solo se inicia el día de la reserva y desde “Confirmada”.</p>';
  },

  admin() {
    const w = S.range === 'week', d = w ? { b: 58, o: 71, r: '3.240 €', v: { relojero: 24, biblioteca: 17, faro: 13, atraco: 9 } } : { b: 231, o: 64, r: '12.880 €', v: { relojero: 78, biblioteca: 61, faro: 52, atraco: 40 } };
    const mx = Math.max(...Object.values(d.v));
    const bars = PUBLIC.map(r => '<div class="bar" data-room="' + r.id + '" style="--v:' + Math.round(d.v[r.id] / mx * 100) + '%"><i></i><b>' + d.v[r.id] + '</b><span>' + r.name + '</span></div>').join('');
    const rooms = ROOMS.map(r => '<tr data-room="' + r.id + '"><td><b>' + r.name + '</b></td><td>' + r.min + '–' + r.max + '</td><td>' + r.dur + ' min</td><td>' + r.price + ' €</td><td>' + (S.rooms[r.id] ? '<span class="badge s-conf">Activa</span>' : '<span class="badge s-canc">Inactiva</span>') + '</td><td><button class="btn ghost" onclick="A.act(\'' + r.id + '\')">' + (S.rooms[r.id] ? 'Desactivar' : 'Activar') + '</button></td></tr>').join('');
    return head('Panel de administración', 'Reservas, ocupación e ingresos.', '<button class="btn">Exportar CSV ↓</button>') +
      '<div class="chips filterbar"><button class="chip ' + (w ? 'on' : '') + '" onclick="A.rg(\'week\')">1–7 octubre</button><button class="chip ' + (w ? '' : 'on') + '" onclick="A.rg(\'month\')">Septiembre</button></div>' +
      '<div class="kpis"><div class="kpi"><span>Reservas</span><b>' + d.b + '</b></div><div class="kpi"><span>Ocupación</span><b>' + d.o + ' %</b></div><div class="kpi"><span>Ingresos</span><b>' + d.r + '</b></div></div>' +
      '<h3 class="sec">Reservas por sala</h3><div class="bars">' + bars + '</div><p class="hint">Las reservas canceladas no cuentan en los ingresos.</p>' +
      '<h3 class="sec">Salas</h3><table class="tbl"><thead><tr><th>Sala</th><th>Jugadores</th><th>Duración</th><th>Precio</th><th>Estado</th><th></th></tr></thead><tbody>' + rooms + '</tbody></table>';
  }
};

const A = {
  go(i) { S.screen = i; if (i !== 2) { S.done = false; S.err = false } render(); scrollTo(0, 0) },
  pick(id, stay) { S.room = id; const r = R(id); S.players = Math.min(r.max, Math.max(r.min, S.players)); firstFree(); S.screen = 1; render(); if (!stay) scrollTo(0, 0) },
  fp(n) { S.fPlayers = n; render() },
  day(i) { S.day = i; firstFree(); render() },
  slot(t) { S.slot = t; render() },
  pl(d) { const r = R(S.room); S.players = Math.min(r.max, Math.max(r.min, S.players + d)); render() },
  fail() { S.err = true; render() },
  ok() { S.done = true; S.err = false; render(); scrollTo(0, 0) },
  reset() { S.done = false; A.go(0) },
  bk(f) { S.bk = f; render() },
  edit(id) { S.edit = id; render() },
  bp(id, d) { const b = S.mine.find(x => x.id === id), r = R(b.room); b.p = Math.min(r.max, Math.max(r.min, b.p + d)); render() },
  cancel(id) { S.mine.find(x => x.id === id).st = 'canc'; render() },
  stf(i) { const g = S.staff[i], n = { pend: 'conf', conf: 'prog', prog: 'done' }[g.st]; if (n) g.st = n; else g.res = '38:20 · escapados'; render() },
  rg(r) { S.range = r; render() },
  act(id) { S.rooms[id] = !S.rooms[id]; render() },
  toast(b) { b.textContent = 'Guardado ✓'; setTimeout(() => b.textContent = 'Guardar cambios', 1400) }
};

function render() {
  const nav = document.getElementById('nav'); let g = '', h = '';
  SCREENS.forEach((s, i) => {
    if (s.group !== g) { g = s.group; h += '<span class="grp">' + g + '</span>' }
    h += '<button class="nv ' + (i === S.screen ? 'on' : '') + '" onclick="A.go(' + i + ')">' + s.label + '</button>';
  });
  nav.innerHTML = h;
  const sc = SCREENS[S.screen];
  document.getElementById('main').innerHTML = '<section class="screen" data-screen="' + sc.id + '" data-room="' + (S.screen === 1 || S.screen === 2 ? S.room : '') + '">' + V[sc.id]() + '</section>';
}

Object.assign(V, window.VIEWS || {});
Object.assign(A, window.ACTIONS || {});
if (window.SCREENS_OVERRIDE) window.SCREENS_OVERRIDE(SCREENS);
document.getElementById('app').innerHTML = '<header class="top"><a class="brand" onclick="A.go(0)">' + (window.BRAND || 'Escape Room') + '</a><nav id="nav"></nav><button class="cta book" onclick="A.go(1)">Reservar</button></header><main id="main"></main>';
firstFree();
render();
