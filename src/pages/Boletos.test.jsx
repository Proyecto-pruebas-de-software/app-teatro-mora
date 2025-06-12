import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Boletos from './Boletos'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'

// Crear un cliente de React Query para las pruebas
const queryClient = new QueryClient()

// Mock de la respuesta de axios
vi.mock('axios')

const mockEventos = [
  { 
    id: 1, 
    nombre: 'Concierto de Rock', 
    fecha: '2025-06-20', 
    hora: '20:00', 
    boletosDisponibles: 100, 
    precio: 20.00 
  },
  { 
    id: 2, 
    nombre: 'Obra de Teatro', 
    fecha: '2025-06-22', 
    hora: '18:00', 
    boletosDisponibles: 0, 
    precio: 25.00 
  }
]

describe('Boletos Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockEventos })
  })

  test('renders loading spinner when data is loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 1000))
    )

    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('renders error alert when data fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Error al cargar los eventos'))

    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar los eventos/i)).toBeInTheDocument()
    })
  })

  test('renders eventos when data is loaded successfully', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Concierto de Rock/i)).toBeInTheDocument()
      expect(screen.getByText(/Obra de Teatro/i)).toBeInTheDocument()
    })
  })

  test('disables "Comprar Boletos" button when no evento is selected or no boletos available', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    // Verificar que el botón esté deshabilitado si no se selecciona evento
    expect(screen.getByRole('button', { name: /Comprar Boletos/i })).toBeDisabled()

    // Seleccionar un evento disponible
    fireEvent.change(screen.getByLabelText(/Evento/i), { target: { value: '1' } })

    // Verificar que el botón esté habilitado
    expect(screen.getByRole('button', { name: /Comprar Boletos/i })).not.toBeDisabled()

    // Seleccionar un evento agotado
    fireEvent.change(screen.getByLabelText(/Evento/i), { target: { value: '2' } })

    // Verificar que el botón esté deshabilitado
    expect(screen.getByRole('button', { name: /Comprar Boletos/i })).toBeDisabled()
  })

  test('filters the quantity of boletos between 1 and 4', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    const cantidadInput = screen.getByLabelText(/Cantidad de Boletos/i)

    // Set to 5 (which should be capped at 4)
    fireEvent.change(cantidadInput, { target: { value: 5 } })
    expect(screen.getByLabelText(/Cantidad de Boletos/i).value).toBe('4')

    // Set to 0 (which should be capped at 1)
    fireEvent.change(cantidadInput, { target: { value: 0 } })
    expect(screen.getByLabelText(/Cantidad de Boletos/i).value).toBe('1')
  })

  test('opens dialog to confirm purchase and handles the purchase', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    // Seleccionamos el evento
    fireEvent.change(screen.getByLabelText(/Evento/i), { target: { value: '1' } })

    // Abrimos el dialogo de compra
    fireEvent.click(screen.getByRole('button', { name: /Comprar Boletos/i }))

    // Verificamos que el dialogo se haya abierto
    expect(screen.getByText(/Confirmar Compra/i)).toBeInTheDocument()

    // Confirmamos la compra
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Compra/i }))

    // Mock de la confirmación de compra
    axios.post.mockResolvedValueOnce({ data: { compraId: '12345' } })

    await waitFor(() => {
      expect(window.location.href).toBe('/boletos/confirmacion/12345')
    })
  })

  test('shows error message when purchase fails', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Boletos />
      </QueryClientProvider>
    )

    // Seleccionamos el evento
    fireEvent.change(screen.getByLabelText(/Evento/i), { target: { value: '1' } })

    // Abrimos el dialogo de compra
    fireEvent.click(screen.getByRole('button', { name: /Comprar Boletos/i }))

    // Confirmamos la compra
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Compra/i }))

    // Mock de fallo en la compra
    axios.post.mockRejectedValueOnce(new Error('Error en la compra'))

    await waitFor(() => {
      expect(screen.getByText(/Error al completar la compra/i)).toBeInTheDocument()
    })
  })
})
