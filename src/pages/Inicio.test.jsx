import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import Inicio from './Inicio';

// Mocks básicos
jest.mock('@tanstack/react-query');
jest.mock('axios');

describe('Componente Inicio', () => {
  const mockEventos = [
    {
      id: '1',
      nombre: 'Concierto de Jazz',
      fecha: '2023-12-15T20:00:00',
      hora: '20:00',
      descripcion: 'Un increíble concierto de jazz con los mejores músicos'
    },
    {
      id: '2',
      nombre: 'Obra de Teatro',
      fecha: '2023-12-20T19:30:00',
      hora: '19:30',
      descripcion: 'Una obra clásica de teatro'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock para useQuery
    useQuery.mockImplementation(() => ({
      data: mockEventos,
      isLoading: false,
      error: null
    }));
    
    // Mock para axios
    axios.get.mockResolvedValue({ data: { data: mockEventos } });
  });

  const renderWithRouter = (ui) => {
    return render(
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    );
  };

  test('renderiza el título principal', () => {
    renderWithRouter(<Inicio />);
    expect(screen.getByText('Bienvenido al Teatro Mora')).toBeInTheDocument();
  });

  test('muestra loading state', () => {
    useQuery.mockImplementation(() => ({ isLoading: true }));
    renderWithRouter(<Inicio />);
    expect(screen.getAllByTestId('skeleton-loading').length).toBeGreaterThan(0);
  });

  test('muestra eventos destacados', () => {
    renderWithRouter(<Inicio />);
    expect(screen.getByText('Próximos Espectáculos')).toBeInTheDocument();
    expect(screen.getByText('Concierto de Jazz')).toBeInDocument();
    expect(screen.getByText('Obra de Teatro')).toBeInDocument();
  });

  test('muestra mensaje cuando no hay eventos', () => {
    useQuery.mockImplementation(() => ({ data: [], isLoading: false }));
    renderWithRouter(<Inicio />);
    expect(screen.getByText(/No hay próximos eventos programados/i)).toBeInTheDocument();
  });

  test('muestra botón para comprar boletos', () => {
    renderWithRouter(<Inicio />);
    expect(screen.getByText('Comprar Boletos')).toBeInTheDocument();
  });
});
