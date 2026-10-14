import RoomsPage from './pages/RoomsPage'
import RoomPage from './pages/RoomPage'

export const roomsRoutes = [
  { path: '/salas', element: <RoomsPage /> },
  { path: '/salas/:slug', element: <RoomPage /> },
]