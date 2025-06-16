import { render, screen, waitFor } from '@testing-library/react';
import DonationHistory from '../components/History'; // Ajusta el path según tu proyecto
import axios from '../axios';
import { vi } from 'vitest';

vi.mock('../axios');

describe('DonationHistory', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      switch (url) {
        case '/donaciones-en-dinero':
          return Promise.resolve({
            data: [
              {
                id_donacion: 1,
                nombres: 'Carlos',
                apellido_paterno: 'Ramírez',
                monto: 500,
                divisa: 'USD',
                nombre_cuenta: 'Banco Uno',
                numero_cuenta: '12345678',
                comprobante_url: 'https://comprobante.com/carlos.pdf'
              }
            ]
          });
        case '/donaciones-en-especie':
          return Promise.resolve({
            data: [
              {
                id_donacion: 2,
                nombres: 'Lucía',
                apellido_paterno: 'Gómez',
                id_articulo: 101,
                id_espacio: 'A2',
                cantidad: 20,
                estado_articulo: 'Bueno',
                id_unidad: 201
              }
            ]
          });
        case '/catalogo':
          return Promise.resolve({
            data: [
              { id_articulo: 101, nombre_articulo: 'Juguetes' }
            ]
          });
        case '/unidades':
          return Promise.resolve({
            data: [
              { id_unidad: 201, simbolo: 'kg' }
            ]
          });
        default:
          return Promise.resolve({ data: [] });
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza donaciones en dinero y especie correctamente', async () => {
    render(<DonationHistory />);

    // Espera a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText('Historial de Donaciones')).toBeInTheDocument();
    });

    // Donación en dinero
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Ramírez')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('Banco Uno')).toBeInTheDocument();
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('Ver Comprobante')).toBeInTheDocument();

    // Donación en especie
    expect(screen.getByText('Lucía')).toBeInTheDocument();
    expect(screen.getByText('Gómez')).toBeInTheDocument();
    expect(screen.getByText('Juguetes')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Bueno')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });
});
