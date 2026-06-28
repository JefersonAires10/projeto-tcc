import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard from '../KpiCard';

describe('KpiCard', () => {
  it('renderiza label e value', () => {
    render(<KpiCard label="Receita Total" value="R$ 1.5M" />);
    expect(screen.getByText('Receita Total')).toBeTruthy();
    expect(screen.getByText('R$ 1.5M')).toBeTruthy();
  });

  it('renderiza badge com classe padrão anual', () => {
    render(<KpiCard label="Teste" value="100" badge="2024" />);
    expect(screen.getByText('2024')).toBeTruthy();
  });

  it('renderiza badge com classe reservado', () => {
    render(<KpiCard label="Teste" value="100" badge="Previsto" badgeClass="reservado" />);
    expect(screen.getByText('Previsto')).toBeTruthy();
  });

  it('renderiza delta com classe positiva', () => {
    render(<KpiCard label="Teste" value="100" delta="+5.2%" deltaClass="pos" />);
    expect(screen.getByText('+5.2%')).toBeTruthy();
  });

  it('renderiza delta com classe negativa', () => {
    render(<KpiCard label="Teste" value="100" delta="-3.1%" deltaClass="neg" />);
    expect(screen.getByText('-3.1%')).toBeTruthy();
  });

  it('renderiza sub', () => {
    render(<KpiCard label="Teste" value="100" sub="Últimos 12 meses" />);
    expect(screen.getByText('Últimos 12 meses')).toBeTruthy();
  });

  it('renderiza todos os props simultaneamente', () => {
    render(
      <KpiCard
        label="Despesa"
        value="R$ 500K"
        badge="Efetuado"
        badgeClass="efetuado"
        delta="+2%"
        deltaClass="pos"
        sub="Até o momento"
      />
    );
    expect(screen.getByText('Despesa')).toBeTruthy();
    expect(screen.getByText('R$ 500K')).toBeTruthy();
    expect(screen.getByText('Efetuado')).toBeTruthy();
    expect(screen.getByText('+2%')).toBeTruthy();
    expect(screen.getByText('Até o momento')).toBeTruthy();
  });
});
