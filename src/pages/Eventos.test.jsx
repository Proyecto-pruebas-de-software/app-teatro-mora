import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Eventos from './Eventos';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Create a QueryClient for the test
const queryClient = new QueryClient();

// Mock axios and useAuth
vi.mock('axios');
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockEventos = [
  {
    id: 1,
    nombre: 'Evento 1',
    descripcion: 'Descripción del Evento 1',
    fecha: '2025-06-20',
    hora: '20:00',
    precio: 10,
    aforo: 100,
    vendidos: 50,
    imagen_url: '/placeholder_event.jpg',
    venta_inicio: '2025-06-19T18:00:00Z',
  },
  {
    id: 2,
    nombre: 'Evento 2',
    descripcion: 'Descripción del Evento 2',
    fecha: '2025-06-21',
    hora: '18:00',
    precio: 15,
    aforo: 150,
    vendidos: 100,
    imagen_url: '/placeholder_event.jpg',
    venta_inicio: '2025-06-20T18:00:00Z',
  },
];

describe('Eventos Component', () => {
  beforeEach(() => {
    // Mock the response of the API calls
    axios.get.mockResolvedValueOnce({ data: { data: mockEventos } });

    // Mock the useAuth hook
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  test('renders loading spinner when events are loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 1000))
    );

    render(
      <MemoryRouter initialEntries={['/eventos']}>
        <QueryClientProvider client={queryClient}>
          <Eventos />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders events correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos']}>
        <QueryClientProvider client={queryClient}>
          <Eventos />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check that the event details are rendered
      expect(screen.getByText('Evento 1')).toBeInTheDocument();
      expect(screen.getByText('Evento 2')).toBeInTheDocument();
      expect(screen.getByText('Descripción del Evento 1')).toBeInTheDocument();
      expect(screen.getByText('Precio: $10')).toBeInTheDocument();
    });
  });

  test('handles error when fetching events', async () => {
    axios.get.mockRejectedValueOnce(new Error('Error al cargar los eventos'));

    render(
      <MemoryRouter initialEntries={['/eventos']}>
        <QueryClientProvider client={queryClient}>
          <Eventos />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar los eventos/)).toBeInTheDocument();
    });
  });

  test('filters events based on search term', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos']}>
        <QueryClientProvider client={queryClient}>
          <Eventos />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Buscar eventos/i), {
      target: { value: 'Evento 1' },
    });

    await waitFor(() => {
      // Check if the filtered event is shown
      expect(screen.getByText('Evento 1')).toBeInTheDocument();
      expect(screen.queryByText('Evento 2')).toBeNull();
    });
  });

  test('creates a new event', async () => {
    const mockCreateEvent = vi.fn();

    render(
      <MemoryRouter initialEntries={['/eventos']}>
        <QueryClientProvider client={queryClient}>
          <Eventos />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Crear Evento/i));

    // Fill in the event creation form
    fireEvent.change(screen.getByLabelText(/Nombre del Evento/i), {
      target: { value: 'Nuevo Evento' },
    });
    fireEvent.change(screen.getByLabelText(/Descripción/i), {
      target: { value: 'Descripción del nuevo evento' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: '2025-06-22' },
    });
    fireEvent.change(screen.getByLabelText(/Hora \(HH:MM\)/i), {
      target: { value: '19:00' },
    });
    fireEvent.change(screen.getByLabelText(/Precio/i), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText(/Aforo \(Capacidad\)/i), {
      target: { value: '200' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Crear'));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalled();
    });
  });

  test('navigates to event details when "Más Información" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/eventos']}>
        <QueryClientProvider client={queryClient}>
          <Eventos />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Más Información'));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/eventos/1');
    });
  });
});
