import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Eventos from './Eventos';

// Mocks globales
jest.mock('@tanstack/react-query');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock('../context/AuthContext');
jest.mock('axios');

describe('Componente Eventos', () => {
  let mockNavigate, mockQueryClient;
  const mockEventos = [
    {
      id: '1',
      nombre: 'Concierto de Jazz',
      fecha: '2023-12-15T20:00:00',
      hora: '20:00',
      precio: 25.99,
      descripcion: 'Un increíble concierto de jazz',
      aforo: 100,
      vendidos: 50,
      imagen_url: 'https://example.com/jazz.jpg',
      venta_inicio: '2023-12-10T10:00:00'
    },
    {
      id: '2',
      nombre: 'Obra de Teatro',
      fecha: '2023-12-20T19:30:00',
      hora: '19:30',
      precio: 19.99,
      descripcion: 'Una obra clásica',
      aforo: 80,
      vendidos: 80,
      imagen_url: 'https://example.com/theater.jpg',
      venta_inicio: '2023-12-15T10:00:00'
    }
  ];
  const mockEvento = mockEventos[0];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de useNavigate
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock de useParams
    useParams.mockReturnValue({ id: null });
    
    // Mock de useAuth
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { id: 'user123' }
    });
    
    // Mock de useQueryClient
    mockQueryClient = { invalidateQueries: jest.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
    
    // Mock para useQuery (lista de eventos)
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'eventos' && queryKey.length === 1) {
        return {
          data: mockEventos,
          isLoading: false,
          error: null
        };
      }
      if (queryKey[0] === 'eventos' && queryKey[1] === '1') {
        return {
          data: mockEvento,
          isLoading: false,
          error: null
        };
      }
      return { data: null, isLoading: false, error: null };
    });
    
    // Mock para useMutation
    useMutation.mockImplementation((config) => ({
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      ...config
    }));
    
    // Mock para axios
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/eventos/1')) {
        return Promise.resolve({ data: { data: mockEvento } });
      }
      if (url.includes('/api/eventos')) {
        return Promise.resolve({ data: { data: mockEventos } });
      }
      if (url.includes('/api/cola_virtual/status')) {
        return Promise.resolve({ data: { data: { status: 'not_in_queue' } } });
      }
      return Promise.reject(new Error('Endpoint no mockeado'));
    });
    
    axios.post.mockResolvedValue({ data: {} });
  });

  test('renderiza la lista de eventos', async () => {
    render(<Eventos />);
    
    // Verificar título
    expect(await screen.findByText('Eventos del Teatro')).toBeInTheDocument();
    
    // Verificar eventos
    expect(screen.getByText('Concierto de Jazz')).toBeInTheDocument();
    expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
    
    // Verificar botones de acción
    expect(screen.getAllByText('Más Información').length).toBe(2);
  });

  test('muestra loading state', async () => {
    useQuery.mockImplementation(() => ({ isLoading: true }));
    render(<Eventos />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('muestra error cuando falla la carga', async () => {
    useQuery.mockImplementation(() => ({ error: { message: 'Error de carga' } }));
    render(<Eventos />);
    expect(await screen.findByText(/Error al cargar los eventos/i)).toBeInTheDocument();
  });

  test('filtra eventos por búsqueda', async () => {
    render(<Eventos />);
    
    // Buscar por nombre
    const searchInput = screen.getByLabelText('Buscar eventos');
    fireEvent.change(searchInput, { target: { value: 'Jazz' } });
    
    expect(screen.getByText('Concierto de Jazz')).toBeInTheDocument();
    expect(screen.queryByText('Obra de Teatro')).not.toBeInTheDocument();
    
    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
  });

  test('ordena eventos por fecha y nombre', async () => {
    render(<Eventos />);
    
    // Ordenar por nombre (ascendente)
    const sortSelect = screen.getByLabelText('Ordenar Por');
    fireEvent.change(sortSelect, { target: { value: 'nombre' } });
    
    // Verificar orden (debería aparecer Concierto antes de Obra)
    const eventNames = screen.getAllByText(/Concierto|Obra/);
    expect(eventNames[0]).toHaveTextContent('Concierto de Jazz');
    expect(eventNames[1]).toHaveTextContent('Obra de Teatro');
    
    // Cambiar a orden descendente
    const sortButton = screen.getByRole('button', { name: /toggle sort/i });
    fireEvent.click(sortButton);
    
    // Verificar orden invertido
    const reversedEventNames = screen.getAllByText(/Concierto|Obra/);
    expect(reversedEventNames[0]).toHaveTextContent('Obra de Teatro');
    expect(reversedEventNames[1]).toHaveTextContent('Concierto de Jazz');
  });

  test('navega al detalle del evento', async () => {
    render(<Eventos />);
    
    const detailButtons = screen.getAllByText('Más Información');
    fireEvent.click(detailButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/eventos/1');
  });

  test('muestra botón de crear evento solo para admin', async () => {
    // Usuario no admin
    useAuth.mockReturnValueOnce({
      isAuthenticated: true,
      isAdmin: false,
      user: { id: 'user123' }
    });
    render(<Eventos />);
    expect(screen.queryByText('Crear Evento')).not.toBeInTheDocument();
    
    // Usuario admin
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 'admin123' }
    });
    render(<Eventos />);
    expect(screen.getByText('Crear Evento')).toBeInTheDocument();
  });

  test('abre diálogo para crear evento', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 'admin123' }
    });
    render(<Eventos />);
    
    const createButton = screen.getByText('Crear Evento');
    fireEvent.click(createButton);
    
    expect(await screen.findByText('Crear Nuevo Evento')).toBeInTheDocument();
  });

  test('permite crear un nuevo evento', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 'admin123' }
    });
    render(<Eventos />);
    
    // Abrir diálogo
    const createButton = screen.getByText('Crear Evento');
    fireEvent.click(createButton);
    
    // Rellenar formulario
    fireEvent.change(screen.getByLabelText('Nombre del Evento'), { target: { value: 'Nuevo Evento' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2023-12-25' } });
    fireEvent.change(screen.getByLabelText('Hora (HH:MM)'), { target: { value: '20:00' } });
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Aforo (Capacidad)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Fecha y Hora de Inicio de Venta'), { 
      target: { value: '2023-12-20T10:00' } 
    });
    
    // Enviar formulario
    const submitButton = screen.getByText('Crear');
    fireEvent.click(submitButton);
    
    // Verificar que se llamó a la mutación
    await waitFor(() => {
      expect(useMutation.mock.results[0].value.mutate).toHaveBeenCalled();
    });
  });




  test('redirige a login para usuario no autenticado al intentar comprar', async () => {
    useAuth.mockReturnValueOnce({
      isAuthenticated: false,
      isAdmin: false,
      user: null
    });
    useParams.mockReturnValueOnce({ id: '1' });
    render(<Eventos />);
    
    const buyButton = await screen.findByText('Comprar Boletos');
    fireEvent.click(buyButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });


  test('muestra mensaje cuando no hay eventos', async () => {
    useQuery.mockImplementationOnce(() => ({ data: [], isLoading: false, error: null }));
    render(<Eventos />);
    
    expect(await screen.findByText(/No hay eventos próximos disponibles/i)).toBeInTheDocument();
  });
});