import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import Registro from './Registro';

// Mocks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Componente Registro', () => {
  const mockRegister = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    require('../context/AuthContext').useAuth.mockReturnValue({
      register: mockRegister,
    });
  });

  // Función helper mejorada para obtener los campos del formulario
  const getFormFields = () => {
    const allPasswordInputs = screen.getAllByLabelText(/contraseña/i);
    const allConfirmInputs = screen.getAllByLabelText(/confirmar contraseña/i);
    
    return {
      nombreInput: screen.getByRole('textbox', { name: /nombre completo/i }),
      emailInput: screen.getByRole('textbox', { name: /correo electrónico/i }),
      passwordInput: allPasswordInputs.find(input => 
        input.id === 'password' || input.name === 'password'
      ),
      confirmPasswordInput: allConfirmInputs.find(input => 
        input.id === 'confirmPassword' || input.name === 'confirmPassword'
      ),
      submitButton: screen.getByRole('button', { name: /registrarse/i })
    };
  };

  test('renderiza título principal', () => {
    render(<Registro />);
    expect(screen.getByRole('heading', { 
      name: 'Registrarse',
      level: 1 
    })).toBeInTheDocument();
  });

  test('muestra todos los campos del formulario', () => {
    render(<Registro />);
    const fields = getFormFields();
    
    expect(fields.nombreInput).toBeInTheDocument();
    expect(fields.emailInput).toBeInTheDocument();
    expect(fields.passwordInput).toBeInTheDocument();
    expect(fields.confirmPasswordInput).toBeInTheDocument();
    expect(fields.submitButton).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /¿ya tienes una cuenta\? inicia sesión/i })).toBeInTheDocument();
  });

  test('permite ingresar datos en los campos del formulario', () => {
    render(<Registro />);
    const { nombreInput, emailInput, passwordInput, confirmPasswordInput } = getFormFields();

    fireEvent.change(nombreInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

    expect(nombreInput).toHaveValue('Juan Pérez');
    expect(emailInput).toHaveValue('juan@example.com');
    expect(passwordInput).toHaveValue('Password123!');
    expect(confirmPasswordInput).toHaveValue('Password123!');
  });

  test('muestra error cuando el registro falla', async () => {
    const errorMessage = 'El correo ya está registrado';
    mockRegister.mockResolvedValue({ 
      success: false, 
      error: errorMessage 
    });
    
    render(<Registro />);
    const { nombreInput, emailInput, passwordInput, confirmPasswordInput, submitButton } = getFormFields();
    
    fireEvent.change(nombreInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });


  test('muestra enlace a inicio de sesión correctamente', () => {
    render(<Registro />);
    const link = screen.getByRole('link', { name: /¿ya tienes una cuenta\? inicia sesión/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/iniciar-sesion');
  });
});