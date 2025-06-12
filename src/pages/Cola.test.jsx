import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Cola from './Cola'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Crear un cliente de React Query para las pruebas
const queryClient = new QueryClient()

// Mock de la respuesta de axios
vi.mock('axios')

const mockEvento = {
  id: 1,
  nombre: 'Concierto de Rock',
  fecha: '2025-06-20',
  hora: '20:00',
  aforo: 1000,
  vendidos: 500,
  precio: 20.00,
  venta_inicio: '2025-06-20T18:00:00Z',
}

const mockQueueStatus = {
  status: 'in_queue_waiting',
  turno_numero: 5,
}

describe('Cola Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValueOnce({ data: { data: mockEvento } })
    axios.get.mockResolvedValueOnce({ data: { data: mockQueueStatus } })
    axios.get.mockResolvedValueOnce({ data: { data: 200 } }) // Longitud de la cola
  })

  test('renders loading spinner when data is loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 1000))
    )

    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('renders error alert when data fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Error al cargar los eventos'))

    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar la información de la cola/i)).toBeInTheDocument()
    })
  })

  test('renders event details and queue status correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1&turno=5']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Cola Virtual para Concierto de Rock/i)).toBeInTheDocument()
      expect(screen.getByText(/Tu turno es el número 5/i)).toBeInTheDocument()
      expect(screen.getByText(/Esperando tu turno. Por favor, mantente en esta página/i)).toBeInTheDocument()
    })
  })

  test('displays correct message when queue is not open', async () => {
    const closedEvento = { ...mockEvento, venta_inicio: '2025-06-22T18:00:00Z' } // Cola cerrada

    axios.get.mockResolvedValueOnce({ data: { data: closedEvento } })

    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/La cola para este evento está cerrada actualmente/i)).toBeInTheDocument()
    })
  })

  test('allows user to join the queue and shows correct status', async () => {
    axios.post.mockResolvedValueOnce({ data: { status: true, data: { turno_numero: 10 } } })

    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    // Unirse a la cola
    fireEvent.click(screen.getByRole('button', { name: /Unirse a la Cola/i }))

    await waitFor(() => {
      expect(screen.getByText(/Estás en la cola/i)).toBeInTheDocument()
      expect(screen.getByText(/Tu posición en la cola: 10/i)).toBeInTheDocument()
    })
  })

  test('handles countdown timer correctly when it is the user\'s turn', async () => {
    jest.useFakeTimers()

    const mockTurno = { status: 'in_turn', turno_numero: 1 }
    axios.get.mockResolvedValueOnce({ data: { data: mockTurno } })

    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/¡Es tu turno!/i)).toBeInTheDocument()
    })

    // Simulamos que pasa un minuto
    jest.advanceTimersByTime(60000)

    await waitFor(() => {
      expect(screen.getByText(/Tiempo restante: 4:00/i)).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  test('redirects to ticket purchase page when "Ir a Comprar Boletos" button is clicked', async () => {
    const mockTurno = { status: 'in_turn', turno_numero: 1 }
    axios.get.mockResolvedValueOnce({ data: { data: mockTurno } })

    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/¡Es tu turno!/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Ir a Comprar Boletos/i }))

    await waitFor(() => {
      expect(window.location.href).toBe('/boletos?eventoId=1')
    })
  })

  test('shows error message when trying to join queue without being authenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/cola?eventoId=1']}>
        <QueryClientProvider client={queryClient}>
          <Cola />
        </QueryClientProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Unirse a la Cola/i }))

    await waitFor(() => {
      expect(screen.getByText(/Por favor, inicia sesión para ver tu estado en la cola/i)).toBeInTheDocument()
    })
  })
})
