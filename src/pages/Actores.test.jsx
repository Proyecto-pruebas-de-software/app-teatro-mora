import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Actores from './Actores'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'

// Mock completo de axios
vi.mock('axios')

const mockActores = [
  { id: 1, nombre: 'Keanu Reeves', biografia_resumen: 'Actor famoso por Matrix' },
  { id: 2, nombre: 'Carrie-Anne Moss', biografia_resumen: 'Actriz conocida por The Matrix' },
  { id: 3, nombre: 'Laurence Fishburne', biografia_resumen: 'Actor de la saga Matrix' }
]

// Configuración especial de QueryClient para tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Desactivar reintentos para tests
    },
  },
})

describe('Actores Component', () => {
  let queryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    axios.get.mockReset() // Limpiar mocks entre tests
  })

  test('renders loading spinner when data is loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: { data: [] } }), 1000))
    )
    
    render(
      <QueryClientProvider client={queryClient}>
        <Actores />
      </QueryClientProvider>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  test('renders error alert when data fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Error al cargar los actores'))
    
    render(
      <QueryClientProvider client={queryClient}>
        <Actores />
      </QueryClientProvider>
    )

    // Aumentar el timeout y buscar por rol de alerta
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    expect(screen.getByText(/Error al cargar los actores/i)).toBeInTheDocument()
  })

  test('renders actores when data is loaded successfully', async () => {
  axios.get.mockResolvedValue({ data: { data: mockActores } });
  
  render(
    <QueryClientProvider client={queryClient}>
      <Actores />
    </QueryClientProvider>
  );

  // En lugar de buscar por test-id, buscamos directamente los actores
  await waitFor(() => {
    // Verificamos que los 3 actores están presentes
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(3);
  }, { timeout: 3000 });
  
  // Verificamos los nombres específicos
  expect(screen.getByText(/Keanu Reeves/i)).toBeInTheDocument();
  expect(screen.getByText(/Carrie-Anne Moss/i)).toBeInTheDocument();
  expect(screen.getByText(/Laurence Fishburne/i)).toBeInTheDocument();
});

  test('filters actores by search term', async () => {
    axios.get.mockResolvedValue({ data: { data: mockActores } })
    
    render(
      <QueryClientProvider client={queryClient}>
        <Actores />
      </QueryClientProvider>
    )

    // Esperar a que los actores se carguen primero
    await waitFor(() => {
      expect(screen.getByText(/Keanu Reeves/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Buscar "Keanu"
    fireEvent.change(screen.getByLabelText(/Buscar Actores/i), { 
      target: { value: 'Keanu' } 
    })

    await waitFor(() => {
      expect(screen.getByText(/Keanu Reeves/i)).toBeInTheDocument()
      expect(screen.queryByText(/Carrie-Anne Moss/i)).not.toBeInTheDocument()
    })
  })

  test('renders "Sin biografía" if no biografía is provided', async () => {
    const mockActoresSinBiografia = [
      { id: 1, nombre: 'No Biografía', biografia_resumen: '' }
    ]
    axios.get.mockResolvedValue({ data: { data: mockActoresSinBiografia } })
    
    render(
      <QueryClientProvider client={queryClient}>
        <Actores />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/Sin biografía/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})