import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Cola from './Cola';
import { useAuth } from '../context/AuthContext';

// Mocks globales
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { data: {} }})),
  post: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Componente Cola', () => {
  const mockNavigate = jest.fn();
  const mockEvento = {
    id: '1',
    nombre: 'Concierto de Jazz',
    fecha: '2023-12-15T20:00:00',
    hora: '20:00',
    precio: 25.99,
    aforo: 100,
    vendidos: 50,
    venta_inicio: '2023-12-10T10:00:00'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mocks básicos estables
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ search: '?eventoId=1' });
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user123' }
    });
    
    // Mock para useQuery
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'userQueueStatus') {
        return {
          data: { status: 'in_queue_waiting', turno_numero: 5 },
          isLoading: false,
          error: null,
          refetch: jest.fn()
        };
      }
      if (queryKey[0] === 'queueLength') {
        return {
          data: 15,
          isLoading: false,
          error: null
        };
      }
      return { 
        data: null, 
        isLoading: false, 
        error: null 
      };
    });
    
    // Mock para axios.get - importante que sea una promesa resuelta
    axios.get.mockResolvedValue({ data: { data: mockEvento } });
  });

  test('renderiza título principal', async () => {
    render(<Cola />);
    expect(await screen.findByText(/Cola Virtual para/i)).toBeInTheDocument();
  });

  test('muestra spinner cuando está cargando', () => {
    useQuery.mockImplementation(() => ({ isLoading: true }));
    render(<Cola />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('muestra error cuando falla la carga', () => {
    useQuery.mockImplementation(() => ({ error: { message: 'Error de carga' } }));
    render(<Cola />);
    expect(screen.getByText(/Error al cargar la información de la cola/i)).toBeInTheDocument();
  });


  test('muestra posición en la cola', async () => {
    render(<Cola />);
    
    // Buscar específicamente en la sección de estado
    const estadoSection = await screen.findByText(/Tu Estado en la Cola/i);
    const cardContent = estadoSection.closest('.MuiCardContent-root');
    
    expect(cardContent).toHaveTextContent('Tu posición en la cola:');
    expect(cardContent).toHaveTextContent('5');
  });

  test('muestra tiempo estimado de espera', async () => {
    render(<Cola />);
    
    // Buscar específicamente en la sección de información general
    const infoSection = await screen.findByText(/Información General de la Cola/i);
    const cardContent = infoSection.closest('.MuiCardContent-root');
    
    expect(cardContent).toHaveTextContent('75 minutos');
  });

  test('muestra longitud de la cola', async () => {
    render(<Cola />);
    
    // Buscar específicamente en la sección de información general
    const infoSection = await screen.findByText(/Información General de la Cola/i);
    const cardContent = infoSection.closest('.MuiCardContent-root');
    
    expect(cardContent).toHaveTextContent('15 personas');
  });
});