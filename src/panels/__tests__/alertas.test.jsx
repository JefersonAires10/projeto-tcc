import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../api', () => ({
  getNotasEmpenhos: vi.fn(() => Promise.resolve([{ numero_empenho: 'EMP-001', codigo_orgao: '01' }])),
  getNotasFiscais: vi.fn(() => Promise.resolve([])),
  getNotasPagamentos: vi.fn(() => Promise.resolve([])),
  orcParams: vi.fn(() => ({ codigo_municipio: '144', exercicio_orcamento: '202600' })),
  fmt: vi.fn((v) => String(v)),
  fmtBRL: vi.fn((v) => String(v)),
  fmtN: vi.fn((v) => String(v)),
  MUNICIPIOS_SERTAO: [{ codigo: '144', nome: 'Quixadá' }],
}));

import F6 from '../alertas';

describe('Painel Alertas', () => {
  it('renderiza sem lançar erro', async () => {
    expect(() => render(<F6 municipio="144" ano="2026" />)).not.toThrow();
  });

  it('renderiza título Central de Alertas — Compliance após carregar', async () => {
    render(<F6 municipio="144" ano="2026" />);
    await waitFor(() => {
      expect(screen.getAllByText('Central de Alertas — Compliance').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renderiza com ano vazio sem erro', () => {
    expect(() => render(<F6 municipio="144" ano="" />)).not.toThrow();
  });

  it('chama onAlertCountChange quando fornecido', async () => {
    const onAlertCountChange = vi.fn();
    render(<F6 municipio="144" ano="2026" onAlertCountChange={onAlertCountChange} />);
    await waitFor(() => expect(onAlertCountChange).toHaveBeenCalled());
  });
});
