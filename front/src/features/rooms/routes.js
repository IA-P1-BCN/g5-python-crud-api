import RoomPage from './pages/RoomPage.jsx'
import RoomsPage from './pages/RoomsPage.jsx'

export const roomsRoutes = [
  { path: '/salas', Component: RoomsPage },
  { path: '/salas/:slug', Component: RoomPage },
]
