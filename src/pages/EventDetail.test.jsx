import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EventDetail from './EventDetail';

// Mocks globales
jest.mock('@tanstack/react-query');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock('axios');

describe('Componente EventDetail', () => {
  let mockNavigate;
  const mockEvent = {
    id: '1',
    nombre: 'Concierto de Jazz',
    fecha: '2023-12-15T20:00:00',
    hora: '20:00',
    precio: 25.99,
    descripcion: 'Un increíble concierto de jazz con los mejores músicos',
    duracion: 120,
    edad_recomendada: 'Para todas las edades',
    como_llegar: 'Teatro Principal, Calle Falsa 123',
    elenco: 'John Coltrane, Miles Davis, Ella Fitzgerald',
    imagen_url: 'https://example.com/event.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de useNavigate
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock de useParams
    useParams.mockReturnValue({ id: '1' });
    
    // Mock para useQuery
    useQuery.mockImplementation(({ queryKey, queryFn }) => ({
      data: queryKey[0] === 'eventoDetalle' ? mockEvent : null,
      isLoading: false,
      error: null,
    }));
    
    // Mock para axios
    axios.get.mockResolvedValue({ data: { data: mockEvent } });
  });

  test('renderiza título principal cuando hay datos', async () => {
    render(<EventDetail />);
    expect(await screen.findByText('Concierto de Jazz')).toBeInTheDocument();
  });

  test('muestra loading state', async () => {
    useQuery.mockImplementation(() => ({ isLoading: true }));
    render(<EventDetail />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('muestra error cuando falla la carga', async () => {
    useQuery.mockImplementation(() => ({ error: { message: 'Error de carga' } }));
    render(<EventDetail />);
    expect(await screen.findByText(/Error al cargar los detalles del evento/i)).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay evento', async () => {
    useQuery.mockImplementation(() => ({ data: null }));
    render(<EventDetail />);
    expect(await screen.findByText(/Evento no encontrado/i)).toBeInTheDocument();
  });

  test('muestra información básica del evento', async () => {
    render(<EventDetail />);
    await waitFor(() => {
      expect(screen.getByText(/Fecha:/i)).toHaveTextContent('15-12-2023');
      expect(screen.getByText(/Hora:/i)).toHaveTextContent('20:00');
      expect(screen.getByText(/25.99/i)).toBeInTheDocument();
      expect(screen.getByText(/Para todas las edades/i)).toBeInTheDocument();
    });
  });

  test('muestra la imagen del evento', async () => {
    render(<EventDetail />);
    const image = await screen.findByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/event.jpg');
    expect(image).toHaveAttribute('alt', 'Concierto de Jazz');
  });

  test('muestra botones de acción', async () => {
    render(<EventDetail />);
    expect(await screen.findByText(/Comprar Entradas/i)).toBeInTheDocument();
    expect(screen.getByText(/Ir al Foro/i)).toBeInTheDocument();
    expect(screen.getByText(/← Volver a Eventos/i)).toBeInTheDocument();
  });

  test('navega a la página de cola al hacer clic en Comprar Entradas', async () => {
    render(<EventDetail />);
    const buyButton = await screen.findByText(/Comprar Entradas/i);
    fireEvent.click(buyButton);
    expect(mockNavigate).toHaveBeenCalledWith('/cola?eventoId=1');
  });

  test('navega al foro al hacer clic en Ir al Foro', async () => {
    render(<EventDetail />);
    const forumButton = await screen.findByText(/Ir al Foro/i);
    fireEvent.click(forumButton);
    expect(mockNavigate).toHaveBeenCalledWith('/foro/1');
  });

  test('navega atrás al hacer clic en Volver a Eventos', async () => {
    render(<EventDetail />);
    const backButton = await screen.findByText(/← Volver a Eventos/i);
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/eventos');
  });

  test('muestra sección "Acerca de este evento"', async () => {
    render(<EventDetail />);
    expect(await screen.findByText(/Acerca de este evento/i)).toBeInTheDocument();
    expect(screen.getByText(/Un increíble concierto de jazz/i)).toBeInTheDocument();
  });

  test('muestra información adicional si está disponible', async () => {
    render(<EventDetail />);
    expect(await screen.findByText(/Duración: 120 minutos/i)).toBeInTheDocument();
    expect(screen.getByText(/Cómo llegar: Teatro Principal/i)).toBeInTheDocument();
    expect(screen.getByText(/Elenco: John Coltrane/i)).toBeInTheDocument();
  });

  test('usa placeholder image cuando no hay imagen_url', async () => {
    const mockEventWithoutImage = {
      ...mockEvent,
      imagen_url: null
    };
    useQuery.mockImplementation(() => ({ data: mockEventWithoutImage }));
    
    render(<EventDetail />);
    const image = await screen.findByRole('img');
    expect(image).toHaveAttribute('src', '/placeholder_event_detail.jpg');
  });
});
