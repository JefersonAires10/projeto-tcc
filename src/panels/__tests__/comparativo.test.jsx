import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('chart.js/auto', () => {
  const MockChart = vi.fn(() => ({ destroy: vi.fn(), update: vi.fn() }));
  return { Chart: MockChart, default: MockChart };
});

vi.mock('../../api', () => ({
  getOrcamentoDespesa: vi.fn(() => Promise.resolve([])),
  getBalanceteDespesa: vi.fn(() => Promise.resolve([])),
  orcParams: vi.fn(() => ({ codigo_municipio: '144', exercicio_orcamento: '202600' })),
  fmtN: vi.fn((v) => String(v)),
  fmt: vi.fn((v) => String(v)),
  fmtBRL: vi.fn((v) => String(v)),
}));

import F5Comparativo from '../comparativo';

describe('Painel Comparativo', () => {
  it('renderiza sem lançar erro', async () => {
    expect(() => render(<F5Comparativo ano="2026" />)).not.toThrow();
  });

  it('renderiza título Desempenho Fiscal Regional após carregar', async () => {
    render(<F5Comparativo ano="2026" />);
    await waitFor(() => {
      expect(screen.getAllByText('Desempenho Fiscal Regional').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renderiza com ano vazio sem erro', () => {
    expect(() => render(<F5Comparativo ano="" />)).not.toThrow();
  });
});
