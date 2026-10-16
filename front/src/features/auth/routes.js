// Routes of the auth feature: /login -> LoginPage. Route objects { path, Component }; composed in app/routes.jsx.
import LoginPage from './pages/LoginPage.jsx'

export const authRoutes = [{ path: '/login', Component: LoginPage }]
