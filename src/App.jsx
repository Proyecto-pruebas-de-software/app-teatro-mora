import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import theme from './theme'

// Components
import Navbar from './components/Navbar'

// Pages
import Inicio from './pages/Inicio'
import Eventos from './pages/Eventos'
import Actores from './pages/Actores'
import Boletos from './pages/Boletos'
import Cola from './pages/Cola'
import Foro from './pages/Foro'
import EventForumPage from './pages/EventForumPage'
import EventDetail from './pages/EventDetail'
import InicioSesion from './pages/InicioSesion'
import Registro from './pages/Registro'

const queryClient = new QueryClient()

// Protected Route Component
function ProtectedRoute({ children, requireAuth = true, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/iniciar-sesion" />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" />
  }

  return children
}

// Public Route Component (redirects to home if already authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" />
  }

  return children
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div className="App">
              <Navbar />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Inicio />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/:id" element={<EventDetail />} />
                <Route path="/actores" element={<Actores />} />
                
                {/* Auth Routes */}
                <Route
                  path="/iniciar-sesion"
                  element={
                    <PublicRoute>
                      <InicioSesion />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/registro"
                  element={
                    <PublicRoute>
                      <Registro />
                    </PublicRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/boletos"
                  element={
                    <ProtectedRoute>
                      <Boletos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cola"
                  element={
                    <ProtectedRoute>
                      <Cola />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/foro"
                  element={
                    <ProtectedRoute>
                      <Foro />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/foro/:eventoId"
                  element={
                    <ProtectedRoute>
                      <EventForumPage />
                    </ProtectedRoute>
                  }
                />
                {/* <Route
                  path="/foro/evento/:eventoId"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <Foro />
                    </ProtectedRoute>
                  }
                /> */}
              </Routes>
            </div>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App 