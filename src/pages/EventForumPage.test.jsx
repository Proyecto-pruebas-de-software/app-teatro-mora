import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventForumPage from './EventForumPage';
import axios from 'axios';

// Mocking axios
vi.mock('axios');

// Create a QueryClient for the test
const queryClient = new QueryClient();

describe('EventForumPage', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
    axios.delete.mockReset();
    axios.put.mockReset();
  });

  test('renders loading spinner while fetching event details and messages', () => {
    axios.get.mockResolvedValueOnce({ data: { data: { nombre: 'Test Event' } } });
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when fetching event details fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Event not found'));

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los detalles del evento.')).toBeInTheDocument();
    });
  });

  test('displays event forum correctly', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    const mockMessages = [{ id: 'msg1', mensaje: 'First message' }];
    
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });
    axios.get.mockResolvedValueOnce({ data: { data: mockMessages } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Foro del Evento: Test Event')).toBeInTheDocument();
      expect(screen.getByText('First message')).toBeInTheDocument();
    });
  });

  test('validates and submits a new message', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Título del Tema (Tu Mensaje Inicial)'), { target: { value: 'New Forum Post' } });
    fireEvent.click(screen.getByRole('button', { name: /Publicar Tema/ }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  test('shows error when trying to post an empty message', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Publicar Tema/ }));

    await waitFor(() => {
      expect(screen.getByText('El mensaje no puede estar vacío.')).toBeInTheDocument();
    });
  });

  test('allows replying to a message', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    const mockMessages = [{ id: 'msg1', mensaje: 'First message' }];
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });
    axios.get.mockResolvedValueOnce({ data: { data: mockMessages } });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('First message'));

    fireEvent.change(screen.getByLabelText('Tu Respuesta'), { target: { value: 'Reply to message' } });
    fireEvent.click(screen.getByRole('button', { name: /Publicar Respuesta/ }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  test('allows editing a message', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    const mockMessages = [{ id: 'msg1', mensaje: 'First message' }];
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });
    axios.get.mockResolvedValueOnce({ data: { data: mockMessages } });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('First message'));

    fireEvent.change(screen.getByLabelText('Tu Mensaje'), { target: { value: 'Updated message content' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });
  });

  test('allows reporting a message', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    const mockMessages = [{ id: 'msg1', mensaje: 'First message' }];
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });
    axios.get.mockResolvedValueOnce({ data: { data: mockMessages } });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('First message'));
    fireEvent.click(screen.getByRole('button', { name: /Reportar/ }));

    fireEvent.change(screen.getByLabelText('Motivo del Reporte'), { target: { value: 'Inappropriate content' } });
    fireEvent.click(screen.getByRole('button', { name: /Reportar/ }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  test('allows deleting a message', async () => {
    const mockEvent = { id: '1', nombre: 'Test Event' };
    const mockMessages = [{ id: 'msg1', mensaje: 'First message' }];
    axios.get.mockResolvedValueOnce({ data: { data: mockEvent } });
    axios.get.mockResolvedValueOnce({ data: { data: mockMessages } });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <EventForumPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('First message'));

    fireEvent.click(screen.getByRole('button', { name: /Eliminar/ }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledTimes(1);
    });
  });
});
