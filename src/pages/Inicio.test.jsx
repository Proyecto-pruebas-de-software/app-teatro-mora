import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Inicio from './Inicio';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Create a QueryClient for the test
const queryClient = new QueryClient();

// Mock axios
vi.mock('axios');

// Define mock event data
const mockEventos = [
  {
    id: 1,
    nombre: 'Evento 1',
    fecha: '2025-06-20',
    hora: '20:00',
    descripcion: 'Descripción del evento 1',
  },
  {
    id: 2,
    nombre: 'Evento 2',
    fecha: '2025-06-21',
    hora: '19:00',
    descripcion: 'Descripción del evento 2',
  },
  {
    id: 3,
    nombre: 'Evento 3',
    fecha: '2025-06-22',
    hora: '18:00',
    descripcion: 'Descripción del evento 3',
  },
];

describe('Inicio Component', () => {
  beforeEach(() => {
    // Mock the response of the API call
    axios.get.mockResolvedValueOnce({ data: { data: mockEventos } });
  });

  test('renders loading skeleton when data is loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: { data: [] } }), 1000))
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <QueryClientProvider client={queryClient}>
          <Inicio />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByRole('progressbar')).toHaveLength(3); // Skeleton loader for 3 events
  });

  test('renders events correctly when data is fetched', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <QueryClientProvider client={queryClient}>
          <Inicio />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if event names are rendered
      expect(screen.getByText('Evento 1')).toBeInTheDocument();
      expect(screen.getByText('Evento 2')).toBeInTheDocument();
      expect(screen.getByText('Evento 3')).toBeInTheDocument();
    });
  });

  test('displays "No events available" message when no events are found', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter initialEntries={['/']}>
        <QueryClientProvider client={queryClient}>
          <Inicio />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No hay próximos eventos programados')).toBeInTheDocument();
    });
  });

  test('redirects to event details page when "Más Información" button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <QueryClientProvider client={queryClient}>
          <Inicio />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Click on "Más Información" button for Evento 1
      fireEvent.click(screen.getByText('Más Información', { selector: 'button' }));
    });

    // Check if the navigation occurred
    expect(window.location.pathname).toBe('/eventos/1');
  });

  test('displays skeleton loader while fetching events data', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter initialEntries={['/']}>
        <QueryClientProvider client={queryClient}>
          <Inicio />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Ensure that the skeleton loader is visible during the loading phase
      expect(screen.getAllByRole('progressbar')).toHaveLength(3); // Three skeleton loaders
    });
  });
});
