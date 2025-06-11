import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import EventDetail from './EventDetail'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Crear un cliente de React Query para las pruebas
const queryClient = new QueryClient()

// Mock de la respuesta de axios
vi.mock('axios')

const mockEvento = {
  id: 1,
  nombre: 'Concierto de Comedia',
  fecha: '2025-06-20',
  hora: '20:00',
  descripcion: 'Una noche llena de risas y diversión.',
  precio: 15.0,
  duracion: 90,
  edad_recomendada: '18+',
  como_llegar: 'Av. Siempre Viva 123',
  elenco: 'Comediante X, Comediante Y',
  imagen_url: 'https://placeimg.com/500/500/tech',
  venta_inicio: '2025-06-19T18:00:00Z',
}

describe('EventDetail Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValueOnce({ data: { data: mockEvento } })
  })

  test('renders loading spinner when data is loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 1000))
    )

    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('renders error alert when data fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Error al cargar el evento'))

    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar los detalles del evento. Por favor, intente más tarde/i)).toBeInTheDocument()
    })
  })

  test('renders event details correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Concierto de Comedia/i)).toBeInTheDocument()
      expect(screen.getByText(/Fecha: 20\/06\/2025/i)).toBeInTheDocument()
      expect(screen.getByText(/Hora: 20:00/i)).toBeInTheDocument()
      expect(screen.getByText(/Descripción: Una noche llena de risas y diversión/i)).toBeInTheDocument()
      expect(screen.getByText(/Precio: \$15.00/i)).toBeInTheDocument()
    })
  })

  test('renders correct event information when evento not found', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: null } })

    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Evento no encontrado/i)).toBeInTheDocument()
    })
  })

  test('navigates to the list of events when "Volver a Eventos" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Volver a Eventos/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/eventos')
    })
  })

  test('navigates to the ticket queue when "Comprar Entradas" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Comprar Entradas/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/cola')
    })
  })

  test('navigates to the event forum when "Ir al Foro" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos/1']}>
        <QueryClientProvider client={queryClient}>
          <EventDetail />
        </QueryClientProvider>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ir al Foro/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/foro/1')
    })
  })
})
