import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Boletos from './Boletos';

// Mocks globales
jest.mock('@tanstack/react-query');
jest.mock('axios');

const mockEventos = [
  {
    id: '1',
    nombre: 'Concierto de Jazz',
    fecha: '2023-12-15T20:00:00',
    hora: '20:00',
    precio: 25.99,
    boletosDisponibles: 10
  },
  {
    id: '2',
    nombre: 'Obra de Teatro',
    fecha: '2023-12-20T19:30:00',
    hora: '19:30',
    precio: 19.99,
    boletosDisponibles: 0
  }
];

describe('Componente Boletos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock para useQuery
    useQuery.mockImplementation(({ queryFn }) => ({
      data: queryFn ? mockEventos : undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    }));

    // Mock para axios
    axios.get.mockResolvedValue({ data: mockEventos });
    axios.post.mockResolvedValue({ data: { compraId: '12345' } });
  });

  // Función helper para obtener elementos
  const getElements = () => ({
    tituloPrincipal: screen.getByRole('heading', { 
      name: 'Comprar Boletos', 
      level: 1 
    }),
    botonComprar: screen.getByRole('button', { name: 'Comprar Boletos' }),
    campoCantidad: screen.getByRole('spinbutton'),
    inputEvento: screen.getByLabelText('Evento'),
  });

  test('renderiza correctamente', () => {
    render(<Boletos />);
    const elements = getElements();
    
    expect(elements.tituloPrincipal).toBeInTheDocument();
    expect(screen.getByText('Seleccionar Evento')).toBeInTheDocument();
    expect(screen.getByText('Cantidad de Boletos')).toBeInTheDocument();
  });

  test('muestra spinner cuando está cargando', () => {
    useQuery.mockReturnValueOnce({ isLoading: true });
    render(<Boletos />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('muestra error cuando falla la carga', () => {
    useQuery.mockReturnValueOnce({ error: { message: 'Error' } });
    render(<Boletos />);
    expect(screen.getByText(/Error al cargar los eventos/i)).toBeInTheDocument();
  });

  test('permite seleccionar un evento', async () => {
    render(<Boletos />);
    const { inputEvento } = getElements();
    
    // Abrir selector
    fireEvent.mouseDown(inputEvento);
    
    // Seleccionar evento
    const option = await screen.findByText('Concierto de Jazz');
    fireEvent.click(option);
    
    // Verificar que se muestra en el resumen
    expect(await screen.findByText('Evento: Concierto de Jazz')).toBeInTheDocument();
  });

  test('permite cambiar la cantidad de boletos', () => {
    render(<Boletos />);
    const { campoCantidad } = getElements();
    
    fireEvent.change(campoCantidad, { target: { value: '3' } });
    expect(campoCantidad).toHaveValue(3);
  });

  test('limita la cantidad máxima a 4 boletos', () => {
    render(<Boletos />);
    const { campoCantidad } = getElements();
    
    fireEvent.change(campoCantidad, { target: { value: '5' } });
    expect(campoCantidad).toHaveValue(4);
    
    fireEvent.change(campoCantidad, { target: { value: '0' } });
    expect(campoCantidad).toHaveValue(1);
  });

  test('abre diálogo al hacer clic en comprar', async () => {
    render(<Boletos />);
    const { inputEvento, botonComprar } = getElements();
    
    // Seleccionar evento
    fireEvent.mouseDown(inputEvento);
    const option = await screen.findByText('Concierto de Jazz');
    fireEvent.click(option);
    
    // Hacer clic en comprar
    fireEvent.click(botonComprar);
    
    // Verificar diálogo
    expect(await screen.findByText('Confirmar Compra')).toBeInTheDocument();
  });

  test('deshabilita botón sin evento seleccionado', () => {
    render(<Boletos />);
    const { botonComprar } = getElements();
    expect(botonComprar).toBeDisabled();
  });
});