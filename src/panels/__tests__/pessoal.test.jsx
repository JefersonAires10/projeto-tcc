import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('chart.js/auto', () => {
  const MockChart = vi.fn(() => ({ destroy: vi.fn(), update: vi.fn() }));
  return { Chart: MockChart, default: MockChart };
});

const mockAgente = { cpf_servidor: '123', nome_servidor: 'João', codigo_vinculo: 'E' };
const mockFolha = { data_referencia_doc: '202601', valor_total_item_orc: 100000, ano_ref: '2026' };
const mockFolhaAgente = { cpf_servidor: '123', valor_remuneracao: 5000 };
vi.mock('../../api', () => ({
  getAgentesPublicos: vi.fn(() => Promise.resolve({ elements: [mockAgente] })),
  getItensRemuneratorios: vi.fn(() => Promise.resolve({ elements: [] })),
  getDesligamentos: vi.fn(() => Promise.resolve({ elements: [] })),
  getFolhasPagamentos: vi.fn(() => Promise.resolve({ elements: [mockFolha] })),
  getAgentesPublicosFolha: vi.fn(() => Promise.resolve({ elements: [mockFolhaAgente] })),
  getReingressos: vi.fn(() => Promise.resolve({ elements: [] })),
  getDiarias: vi.fn(() => Promise.resolve({ elements: [] })),
  fmt: vi.fn((v) => String(v)),
  fmtBRL: vi.fn((v) => String(v)),
  fmtN: vi.fn((v) => String(v)),
  muniParams: vi.fn(() => ({ codigo_municipio: '144' })),
}));

import F3 from '../pessoal';

describe('Painel Pessoal', () => {
  it('renderiza sem lançar erro', async () => {
    expect(() => render(<F3 municipio="144" ano="2026" />)).not.toThrow();
  });

  it('renderiza título Radar de Folha de Pagamento após carregar', async () => {
    render(<F3 municipio="144" ano="2026" />);
    await waitFor(() => {
      expect(screen.getAllByText('Radar de Folha de Pagamento').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renderiza com ano vazio sem erro', () => {
    expect(() => render(<F3 municipio="144" ano="" />)).not.toThrow();
  });
});
