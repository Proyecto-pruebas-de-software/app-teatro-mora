import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import EventForumPage from './EventForumPage';

// Mocks globales
jest.mock('@tanstack/react-query');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));
jest.mock('../context/AuthContext');
jest.mock('axios');

describe('Componente EventForumPage', () => {
  let mockNavigate, mockQueryClient;
  const mockUser = { id: 'user123', nombre: 'Test User' };
  const mockEvent = {
    id: '1',
    nombre: 'Concierto de Jazz'
  };
  const mockMessages = [
    {
      id: '1',
      mensaje: 'Primer tema de discusión',
      usuario_id: 'user123',
      usuario_nombre: 'Test User',
      creado_en: '2023-12-10T10:00:00Z',
      replies_count: 3
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de useNavigate
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock de useParams
    useParams.mockReturnValue({ eventoId: '1' });
    
    // Mock de useLocation
    useLocation.mockReturnValue({ search: '' });
    
    // Mock de useAuth
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isAdmin: false
    });
    
    // Mock de useQueryClient
    mockQueryClient = { invalidateQueries: jest.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
    
    // Mock para useQuery (eventoDetalle)
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'eventoDetalle') {
        return {
          data: mockEvent,
          isLoading: false,
          error: null
        };
      }
      if (queryKey[0] === 'mensajes') {
        return {
          data: mockMessages,
          isLoading: false,
          error: null
        };
      }
      return { data: null, isLoading: false, error: null };
    });
    
    // Mock para useMutation
    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false
    });
    
    // Mock para axios
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/eventos/1')) {
        return Promise.resolve({ data: { data: mockEvent } });
      }
      if (url.includes('/api/mensajes')) {
        return Promise.resolve({ data: { data: mockMessages } });
      }
      return Promise.reject(new Error('Endpoint no mockeado'));
    });
    
    axios.post.mockResolvedValue({ data: {} });
  });

  test('renderiza el foro del evento con temas', async () => {
    render(<EventForumPage />);
    
    expect(await screen.findByText(/Foro del Evento: Concierto de Jazz/i)).toBeInTheDocument();
    expect(screen.getByText(/Primer tema de discusión/i)).toBeInTheDocument();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  test('permite publicar un nuevo tema', async () => {
    render(<EventForumPage />);
    
    const input = screen.getByLabelText(/Título del Tema/i);
    fireEvent.change(input, { target: { value: 'Nuevo tema de prueba' } });
    
    const submitButton = screen.getByText(/Publicar Tema/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/mensajes', {
        mensaje: 'Nuevo tema de prueba',
        evento_id: '1',
        parent_mensaje_id: null
      });
    });
  });

test('valida el formulario de nuevo tema', async () => {
  render(<EventForumPage />);
  
  const input = screen.getByLabelText(/Título del Tema/i);
  const submitButton = screen.getByText(/Publicar Tema/i);

  // Test 1: Validación de campo vacío
  await act(async () => {
    fireEvent.click(submitButton);
  });

  // Buscar el elemento por su rol
  const errorElement = await screen.findByRole('alert');
  expect(errorElement).toHaveTextContent(/El mensaje no puede estar vacío/i);

  // Test 2: Validación de longitud mínima
  await act(async () => {
    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.click(submitButton);
  });

  const errorElement2 = await screen.findByRole('alert');
  expect(errorElement2).toHaveTextContent(/El mensaje debe tener al menos 5 caracteres/i);
});

  test('navega correctamente a la página del evento', async () => {
    render(<EventForumPage />);
    
    const backButton = screen.getByText(/Volver al Evento/i);
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/eventos/1');
  });
});
