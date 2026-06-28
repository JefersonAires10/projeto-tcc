import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('chart.js/auto', () => {
  const MockChart = vi.fn(() => ({ destroy: vi.fn(), update: vi.fn() }));
  return { Chart: MockChart, default: MockChart };
});

const mockLic = { numero_licitacao: '001/2026', valor_orcado_estimado: 500000, modalidade_licitacao: '1', descricao_objeto_licitacao: 'Teste' };
const mockContrato = { numero_contrato: 'CTR-001/2026', valor: 300000, modalide_contrato: 'PA', tipo_contrato: 'O', data_inicio_vigencia_contrato: '2026-01-01', data_fim_vigencia_contrato: '2027-01-01' };
vi.mock('../../api', () => ({
  getLicitacoes: vi.fn(() => Promise.resolve({ elements: [mockLic] })),
  getContrato: vi.fn(() => Promise.resolve({ elements: [mockContrato] })),
  getLicitantes: vi.fn(() => Promise.resolve([])),
  getItensLicitacoes: vi.fn(() => Promise.resolve([])),
  getDotacoesLicitacoes: vi.fn(() => Promise.resolve([])),
  getContratados: vi.fn(() => Promise.resolve([])),
  getNotasEmpenhos: vi.fn(() => Promise.resolve([])),
  licParams: vi.fn(() => ({ codigo_municipio: '144', exercicio_orcamento: '202600' })),
  fmt: vi.fn((v) => String(v)),
  fmtBRL: vi.fn((v) => String(v)),
  fmtN: vi.fn((v) => String(v)),
  muniParams: vi.fn(() => ({ codigo_municipio: '144' })),
  fmtAno: vi.fn((v) => String(v)),
}));

import F2 from '../licitacoes';

describe('Painel Licitações', () => {
  it('renderiza sem lançar erro', async () => {
    expect(() => render(<F2 municipio="144" ano="2026" />)).not.toThrow();
  });

  it('renderiza título Monitor de Licitações e Contratos após carregar', async () => {
    render(<F2 municipio="144" ano="2026" />);
    await waitFor(() => {
      expect(screen.getAllByText('Monitor de Licitações e Contratos').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renderiza com ano vazio sem erro', () => {
    expect(() => render(<F2 municipio="144" ano="" />)).not.toThrow();
  });
});
