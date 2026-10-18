// Routes of the auth feature: /login and /register. They are public (app/routes.jsx keeps them outside RequireAuth).
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

export const authRoutes = [
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
]
