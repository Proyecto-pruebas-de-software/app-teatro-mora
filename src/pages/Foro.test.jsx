import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Foro from './Foro';

// Mocks básicos
jest.mock('@tanstack/react-query');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.mock('axios');

describe('Componente Foro', () => {
  const mockEventos = [
    {
      id: '1',
      nombre: 'Concierto de Jazz',
      fecha: '2023-12-15T20:00:00'
    },
    {
      id: '2',
      nombre: 'Obra de Teatro',
      fecha: '2023-12-20T19:30:00'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de useNavigate
    useNavigate.mockReturnValue(jest.fn());
    
    // Mock para useQuery
    useQuery.mockImplementation(() => ({
      data: mockEventos,
      isLoading: false,
      error: null
    }));
    
    // Mock para axios
    axios.get.mockResolvedValue({ data: { data: mockEventos } });
  });

  test('renderiza el título principal', () => {
    render(<Foro />);
    expect(screen.getByText('Foros por Evento')).toBeInTheDocument();
  });

  test('muestra loading state', () => {
    useQuery.mockImplementation(() => ({ isLoading: true }));
    render(<Foro />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('muestra lista de eventos', () => {
    render(<Foro />);
    expect(screen.getByText('Concierto de Jazz')).toBeInTheDocument();
    expect(screen.getByText('Obra de Teatro')).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay eventos', () => {
    useQuery.mockImplementation(() => ({ data: [], isLoading: false }));
    render(<Foro />);
    expect(screen.getByText(/No hay eventos disponibles/i)).toBeInTheDocument();
  });

  test('navega al foro del evento al hacer clic', () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    
    render(<Foro />);
    const firstEvent = screen.getByText('Concierto de Jazz');
    fireEvent.click(firstEvent);
    
    expect(mockNavigate).toHaveBeenCalledWith('/foro/1');
  });
});