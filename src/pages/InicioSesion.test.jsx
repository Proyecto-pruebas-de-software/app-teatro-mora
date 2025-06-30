import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import InicioSesion from './InicioSesion';

// Mocks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Componente InicioSesion', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    require('../context/AuthContext').useAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  test('renderiza título principal', () => {
    render(<InicioSesion />);
    // Buscamos específicamente el título h1
    expect(screen.getByRole('heading', { 
      name: 'Iniciar Sesión',
      level: 1 
    })).toBeInTheDocument();
  });

  test('muestra campos de formulario', () => {
    render(<InicioSesion />);
    expect(screen.getByRole('textbox', { name: /correo electrónico/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /¿no tienes una cuenta\? regístrate/i })).toBeInTheDocument();
  });

  test('permite ingresar email y contraseña', () => {
    render(<InicioSesion />);
    const emailInput = screen.getByRole('textbox', { name: /correo electrónico/i });
    const passwordInput = screen.getByLabelText(/contraseña/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('maneja el envío del formulario con éxito', async () => {
    mockLogin.mockResolvedValue({ success: true });
    render(<InicioSesion />);

    fireEvent.change(screen.getByRole('textbox', { name: /correo electrónico/i }), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('muestra error cuando el login falla', async () => {
    const errorMessage = 'Credenciales inválidas';
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: errorMessage 
    });
    
    render(<InicioSesion />);

    fireEvent.change(screen.getByRole('textbox', { name: /correo electrónico/i }), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { 
      target: { value: 'wrongpassword' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('muestra enlace a registro correctamente', () => {
    render(<InicioSesion />);
    const link = screen.getByRole('link', { name: /¿no tienes una cuenta\? regístrate/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/registro');
  });
});
