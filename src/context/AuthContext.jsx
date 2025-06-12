import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar si el usuario ha iniciado sesión al montar el componente
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Establecer encabezado de autorización predeterminado
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        // Verificar token y obtener datos de usuario
        const response = await axios.get('/api/auth/me')
        console.log('Auth check response from /me:', response.data);
        console.log('User object about to be set in AuthContext (checkAuth):', response.data.data);
        setUser(response.data.data)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { data } = response.data
      console.log('Login API response:', response.data);
      console.log('User object about to be set in AuthContext (login):', data.user);
      
      // Almacenar token y establecer encabezado predeterminado de axios
      localStorage.setItem('token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      
      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.response?.data?.data?.message || 'Error al iniciar sesión'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      console.log('Register API response:', response.data);
      const { data } = response.data;
      console.log('User object about to be set in AuthContext (register):', data.user);
      
      // Almacenar token y establecer encabezado predeterminado de axios
      localStorage.setItem('token', data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      
      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error('Registration failed:', error)
      return {
        success: false,
        error: error.response?.data?.data?.message || 'Error al registrarse'
      }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Limpiar el almacenamiento local y el estado independientemente del éxito de la llamada a la API
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAdmin,
    isAuthenticated
  }

  if (loading) {
    return null // O un spinner de carga
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 