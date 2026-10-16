// Public API of the auth feature. Other features import ONLY from here.
export { authRoutes } from './routes.js'
export { default as AuthProvider } from './components/AuthProvider.jsx'
export { default as RequireRole } from './components/RequireRole.jsx'
export { useAuth } from './hooks/useAuth.js'
export { hasRole } from './model/roles.js'
