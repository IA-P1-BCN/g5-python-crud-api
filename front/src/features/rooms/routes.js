// Routes of the rooms feature: /salas -> RoomsPage, /salas/:slug -> RoomPage.
// Route objects { path, Component }; composed in app/routes.jsx.
import RoomPage from './pages/RoomPage.jsx'
import RoomsPage from './pages/RoomsPage.jsx'

export const roomsRoutes = [
  { path: '/salas', Component: RoomsPage },
  { path: '/salas/:slug', Component: RoomPage },
]
