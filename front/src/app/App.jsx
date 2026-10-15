import { GateLayer } from '@/features/rooms'
import Providers from './providers.jsx'
import AppRoutes from './routes.jsx'

export default function App() {
  return (
    <Providers>
      <AppRoutes />
      <GateLayer />
    </Providers>
  )
}
