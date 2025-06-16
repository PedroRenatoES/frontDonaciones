import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../components/Login'; // Ajusta el path si es diferente
import axios from '../axios';
import { vi } from 'vitest';
import { describe, it, expect } from 'vitest';


// ✅ Mock de axios
vi.mock('../axios');

describe('Sanity check', () => {
  it('funciona vitest', () => {
    expect(true).toBe(true);
  });
});

describe('Login Component', () => {
  it('renderiza los campos de usuario y contraseña', () => {
    render(<Login onLogin={() => {}} />);
    expect(screen.getByLabelText(/USUARIO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CONTRASEÑA/i)).toBeInTheDocument();
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error al fallo de login', async () => {
    const errorMessage = 'Credenciales inválidas';

    axios.post.mockRejectedValueOnce({
      response: {
        data: { error: errorMessage },
      },
    });

    render(<Login onLogin={() => {}} />);

    fireEvent.change(screen.getByLabelText(/USUARIO/i), {
      target: { value: 'usuario123' },
    });
    fireEvent.change(screen.getByLabelText(/CONTRASEÑA/i), {
      target: { value: 'passwordIncorrecto' },
    });

    fireEvent.click(screen.getByText(/Iniciar Sesión/i));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
