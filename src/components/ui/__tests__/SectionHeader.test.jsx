import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeader from '../SectionHeader';

describe('SectionHeader', () => {
  it('renderiza título', () => {
    render(<SectionHeader title="Painel Orçamentário" />);
    expect(screen.getByText('Painel Orçamentário')).toBeTruthy();
  });

  it('renderiza subtítulo quando fornecido', () => {
    render(<SectionHeader title="Título" sub="Subtítulo do painel" />);
    expect(screen.getByText('Subtítulo do painel')).toBeTruthy();
  });

  it('não renderiza subtítulo quando não fornecido', () => {
    render(<SectionHeader title="Apenas Título" />);
    expect(screen.getByText('Apenas Título')).toBeTruthy();
  });
});
