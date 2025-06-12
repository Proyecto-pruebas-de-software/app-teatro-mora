import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Navbar from './Navbar'
import { AuthContext } from '../context/AuthContext'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

const mockAuth = {
  user: { nombre: 'Test User', email: 'test@example.com' },
  isAuthenticated: false,
  isAdmin: false,
  logout: vi.fn(() => Promise.resolve())
}

const renderWithProviders = (ui, { providerProps = mockAuth, ...renderOptions } = {}) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={providerProps}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>,
    renderOptions
  )
}

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders basic elements for unauthenticated user', () => {
    renderWithProviders(<Navbar />)

    expect(screen.getByRole('link', { name: 'TEATRO MORA' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Eventos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Foro' })).not.toBeInTheDocument()
  })

  test('renders additional menu items for authenticated user', () => {
    renderWithProviders(<Navbar />, {
      providerProps: {
        ...mockAuth,
        isAuthenticated: true
      }
    })

    // Usamos waitFor para esperar que los elementos estén visibles
    waitFor(() => {
      expect(screen.getByRole('link', { name: 'Test User' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Eventos' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Boletos' })).toBeInTheDocument()
    })
  })

  test('shows admin badge for admin users', () => {
    renderWithProviders(<Navbar />, {
      providerProps: {
        ...mockAuth,
        isAuthenticated: true,
        isAdmin: true
      }
    })
    
    // Verificamos que el badge de admin esté visible
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  test('handles logout correctly', async () => {
    renderWithProviders(<Navbar />, {
      providerProps: {
        ...mockAuth,
        isAuthenticated: true
      }
    })

    fireEvent.click(screen.getByLabelText(/Abrir configuración/i))
    fireEvent.click(screen.getByRole('menuitem', { name: /Cerrar Sesión/i }))

    await waitFor(() => {
      expect(mockAuth.logout).toHaveBeenCalledTimes(1)
    })
  })

  test('mobile menu opens and closes', async () => {
    renderWithProviders(<Navbar />)

    const menuButton = screen.getByLabelText('account of current user')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Eventos' })).toBeVisible()
    })
    
    fireEvent.click(screen.getByRole('link', { name: 'Eventos' }))
    
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Eventos' })).not.toBeVisible()
    })
  })
})
