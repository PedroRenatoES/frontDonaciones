import { render, screen, waitFor } from '@testing-library/react';
import WelcomePage from '../components/WelcomePage'; // Ajusta si tu ruta es diferente
import axios from '../axios';
import { vi } from 'vitest';

// Mock de axios
vi.mock('../axios');

// Simula localStorage
const mockUsuario = {
  id: 1,
  nombres: 'Juan Pérez',
  correo: 'juan@example.com',
  rol: 1
};

beforeEach(() => {
  localStorage.setItem('usuario', JSON.stringify(mockUsuario));
  localStorage.setItem('cambiarPassword', 'true');
});

// Limpia localStorage después de cada test
afterEach(() => {
  localStorage.clear();
});

describe('WelcomePage', () => {
  it('muestra los datos del usuario y las métricas', async () => {
    // Mock de respuestas de axios
    axios.get.mockImplementation((url) => {
      if (url === '/donantes') return Promise.resolve({ data: Array(5).fill({}) });
      if (url === '/donaciones') return Promise.resolve({ data: Array(10).fill({}) });
      if (url === '/donaciones-en-especie') return Promise.resolve({ data: Array(3).fill({}) });
      return Promise.resolve({ data: [] });
    });

    render(<WelcomePage onLogout={() => {}} />);

    // Esperar a que los datos sean renderizados
    await waitFor(() => {
      expect(screen.getByText(/¡Bienvenido, Juan Pérez!/)).toBeInTheDocument();
      expect(screen.getByText(/Donantes registrados: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Total de donaciones recibidas: 10/)).toBeInTheDocument();
      expect(screen.getByText(/Artículos en inventario: 3/)).toBeInTheDocument();
    });

    // Verifica modal de cambio de contraseña
    expect(screen.getByText(/Cambio obligatorio de contraseña/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nueva contraseña/)).toBeInTheDocument();
  });
});
