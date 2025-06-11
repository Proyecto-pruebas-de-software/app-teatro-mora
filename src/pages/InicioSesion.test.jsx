import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InicioSesion from './InicioSesion';
import { useAuth } from '../context/AuthContext';

// Mocking the login function from useAuth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
}));

// Create a QueryClient for the test
const queryClient = new QueryClient();

describe('InicioSesion Component', () => {
  beforeEach(() => {
    // Reset the mock function before each test
    useAuth().login.mockReset();
  });

  test('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <InicioSesion />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Check that form elements are rendered
    expect(screen.getByLabelText(/Correo Electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/ })).toBeInTheDocument();
  });

  test('shows error message when login fails', async () => {
    useAuth().login.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <InicioSesion />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Fill the form with email and password
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'wrongpassword' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/ }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('redirects to home page on successful login', async () => {
    useAuth().login.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <InicioSesion />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Fill the form with valid email and password
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'correctpassword' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/ }));

    // Wait for the home navigation after login
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  test('clicking "Regístrate" link navigates to registration page', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <InicioSesion />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Click the "Regístrate" link
    fireEvent.click(screen.getByText(/¿No tienes una cuenta\? Regístrate/));

    // Check if the URL changes to the registration page
    expect(window.location.pathname).toBe('/registro');
  });
});
