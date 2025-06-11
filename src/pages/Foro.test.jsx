import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Foro from './Foro';
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
  },
  {
    id: 2,
    nombre: 'Evento 2',
    fecha: '2025-06-21',
  },
];

describe('Foro Component', () => {
  beforeEach(() => {
    // Mock the response of the API call
    axios.get.mockResolvedValueOnce({ data: { data: mockEventos } });
  });

  test('renders loading spinner when events are loading', () => {
    axios.get.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({ data: [] }), 1000))
    );

    render(
      <MemoryRouter initialEntries={['/foro']}>
        <QueryClientProvider client={queryClient}>
          <Foro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders events correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/foro']}>
        <QueryClientProvider client={queryClient}>
          <Foro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check that the events are displayed
      expect(screen.getByText('Evento 1')).toBeInTheDocument();
      expect(screen.getByText('Evento 2')).toBeInTheDocument();
      expect(screen.getByText('Fecha: 6/20/2025')).toBeInTheDocument();
    });
  });

  test('handles error when fetching events', async () => {
    axios.get.mockRejectedValueOnce(new Error('Error al cargar los eventos'));

    render(
      <MemoryRouter initialEntries={['/foro']}>
        <QueryClientProvider client={queryClient}>
          <Foro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar los eventos/)).toBeInTheDocument();
    });
  });

  test('renders "No events available" message when no events are returned', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter initialEntries={['/foro']}>
        <QueryClientProvider client={queryClient}>
          <Foro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No hay eventos disponibles para mostrar foros/)).toBeInTheDocument();
    });
  });

  test('navigates to forum page when event is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/foro']}>
        <QueryClientProvider client={queryClient}>
          <Foro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Simulate clicking on the event card
    fireEvent.click(screen.getByText('Evento 1'));

    await waitFor(() => {
      // Check if the navigation happened
      expect(window.location.pathname).toBe('/foro/1');
    });
  });
});
