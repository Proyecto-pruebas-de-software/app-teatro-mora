import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Registro from './Registro';
import { useAuth } from '../context/AuthContext';

// Mocking the register function from useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: vi.fn(),
  }),
}));

// Create a QueryClient for the test
const queryClient = new QueryClient();

describe('Registro Component', () => {
  beforeEach(() => {
    // Reset the mock function before each test
    useAuth().register.mockReset();
  });

  test('renders registration form correctly', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Registro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Check that form elements are rendered
    expect(screen.getByLabelText(/Nombre Completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrarse/ })).toBeInTheDocument();
  });

  test('shows error message when passwords do not match', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Registro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Fill the form with different passwords
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/), { target: { value: 'DifferentPassword123!' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/ }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });

  test('shows error message when password is weak', async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Registro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Fill the form with weak password
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'weakpassword' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/), { target: { value: 'weakpassword' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/ }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener por lo menos 8 caracteres y contener al menos una letra mayúscula, un número y un carácter especial (@$!%*?&)')).toBeInTheDocument();
    });
  });

  test('successful registration redirects to home page', async () => {
    useAuth().register.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Registro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/), { target: { value: 'Password123!' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/ }));

    // Wait for the redirect to home page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  test('displays error message on failed registration', async () => {
    useAuth().register.mockResolvedValueOnce({ success: false, error: 'Email already taken' });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Registro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/), { target: { value: 'Password123!' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/ }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Email already taken')).toBeInTheDocument();
    });
  });

  test('clicking "Iniciar Sesión" link navigates to login page', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Registro />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Click the "Iniciar Sesión" link
    fireEvent.click(screen.getByText(/¿Ya tienes una cuenta\? Inicia Sesión/));

    // Check if the URL changes to the login page
    expect(window.location.pathname).toBe('/iniciar-sesion');
  });
});
