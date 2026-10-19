import { GateLayer } from '@/features/rooms'
import ErrorBoundary from './ErrorBoundary.jsx'
import NavBar from './layout/NavBar.jsx'
import Providers from './providers.jsx'
import AppRoutes from './routes.jsx'

export default function App() {
  return (
    <Providers>
      <NavBar />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <GateLayer />
    </Providers>
  )
}
