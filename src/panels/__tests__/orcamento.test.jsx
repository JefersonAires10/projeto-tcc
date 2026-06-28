import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('chart.js/auto', () => {
  const MockChart = vi.fn(() => ({ destroy: vi.fn(), update: vi.fn() }));
  return { Chart: MockChart, default: MockChart };
});

const mockData = { elements: [{ vlr_previsto: 1000000, vlr_empenhado: 800000, vlr_liquidado: 600000, mes: '202601' }] };
vi.mock('../../api', () => ({
  getDadosOrcamentos: vi.fn(() => Promise.resolve(mockData)),
  getBalanceteDespesa: vi.fn(() => Promise.resolve(mockData)),
  orcParams: vi.fn(() => ({ codigo_municipio: '144', exercicio_orcamento: '202600' })),
  fmt: vi.fn((v) => String(v)),
  fmtN: vi.fn((v) => String(v)),
  fmtBRL: vi.fn((v) => String(v)),
  MUNICIPIOS_SERTAO: [],
  ANOS: [],
  MESES: [],
}));

import F1 from '../orcamento';

describe('Painel Orçamentário', () => {
  it('renderiza sem lançar erro', async () => {
    expect(() => render(<F1 municipio="144" ano="2026" />)).not.toThrow();
  });

  it('renderiza título Painel Orçamentário após carregar', async () => {
    render(<F1 municipio="144" ano="2026" />);
    await waitFor(() => {
      expect(screen.getAllByText('Painel Orçamentário').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renderiza com ano vazio sem erro', () => {
    expect(() => render(<F1 municipio="144" ano="" />)).not.toThrow();
  });
});
