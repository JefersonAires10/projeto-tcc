import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('chart.js/auto', () => {
  const MockChart = vi.fn(() => ({ destroy: vi.fn(), update: vi.fn() }));
  return { Chart: MockChart, default: MockChart };
});

const mockBem = { numero_registro: 'PM-001', valor_depreciavel: 100000, descricao: 'Teste' };
vi.mock('../../api', () => ({
  getBensMunicipios: vi.fn(() => Promise.resolve({ elements: [mockBem] })),
  getReavalBaixasBens: vi.fn(() => Promise.resolve({ elements: [] })),
  getVeiculosMunicipais: vi.fn(() => Promise.resolve({ elements: [] })),
  getVeiculosLocados: vi.fn(() => Promise.resolve({ elements: [] })),
  getVeiculosCedidos: vi.fn(() => Promise.resolve({ elements: [] })),
  getAbastecimentoVeiculos: vi.fn(() => Promise.resolve({ elements: [] })),
  getManutencaoVeiculos: vi.fn(() => Promise.resolve({ elements: [] })),
  getDestinacaoVeiculos: vi.fn(() => Promise.resolve({ elements: [] })),
  fmt: vi.fn((v) => String(v)),
  fmtBRL: vi.fn((v) => String(v)),
  fmtN: vi.fn((v) => String(v)),
  muniParams: vi.fn(() => ({ codigo_municipio: '144' })),
}));

import F4 from '../patrimonio';

describe('Painel Patrimônio', () => {
  it('renderiza sem lançar erro', async () => {
    expect(() => render(<F4 municipio="144" ano="2026" />)).not.toThrow();
  });

  it('renderiza título Controle Patrimonial e Frotas após carregar', async () => {
    render(<F4 municipio="144" ano="2026" />);
    await waitFor(() => {
      expect(screen.getAllByText('Controle Patrimonial e Frotas').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renderiza com ano vazio sem erro', () => {
    expect(() => render(<F4 municipio="144" ano="" />)).not.toThrow();
  });
});
