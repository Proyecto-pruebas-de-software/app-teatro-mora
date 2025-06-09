import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

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

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        // Verify token and get user data
        const response = await axios.get('/api/auth/me')
        console.log('Auth check response:', response.data)
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
      console.log('Login response:', response.data)
      
      // Store token and set axios default header
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
      const { data } = response.data
      
      // Store token and set axios default header
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
      // Clear local storage and state regardless of API call success
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
    return null // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext 