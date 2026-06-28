import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  it('renderiza o título do portal', () => {
    render(<Sidebar active="f1" alertCount={0} onNavigate={vi.fn()} />);
    expect(screen.getByText('Portal da Transparência')).toBeTruthy();
    expect(screen.getByText('Sertão Transparente')).toBeTruthy();
  });

  it('renderiza todos os 6 itens de navegação', () => {
    render(<Sidebar active="f1" alertCount={0} onNavigate={vi.fn()} />);
    expect(screen.getByText('Painel Orçamentário')).toBeTruthy();
    expect(screen.getByText('Monitor de Licitações')).toBeTruthy();
    expect(screen.getByText('Radar de Pessoal')).toBeTruthy();
    expect(screen.getByText('Controle Patrimonial')).toBeTruthy();
    expect(screen.getByText('Comparativo Regional')).toBeTruthy();
    expect(screen.getByText('Alertas e Compliance')).toBeTruthy();
  });

  it('chama onNavigate ao clicar em item', () => {
    const onNavigate = vi.fn();
    render(<Sidebar active="f1" alertCount={0} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Monitor de Licitações'));
    expect(onNavigate).toHaveBeenCalledWith('f2');
  });

  it('mostra badge de alertas quando alertCount > 0', () => {
    render(<Sidebar active="f1" alertCount={5} onNavigate={vi.fn()} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('não mostra badge quando alertCount é 0', () => {
    const { container } = render(<Sidebar active="f1" alertCount={0} onNavigate={vi.fn()} />);
    const badges = container.querySelectorAll('[style*="var(--red)"]');
    expect(badges.length).toBe(0);
  });

  it('destaca o item ativo', () => {
    render(<Sidebar active="f3" alertCount={0} onNavigate={vi.fn()} />);
    const btn = screen.getByText('Radar de Pessoal').closest('button');
    expect(btn.style.background).toBe('var(--blue-bg)');
  });

  it('mostra quantidade de municípios monitorados', () => {
    render(<Sidebar active="f1" alertCount={0} onNavigate={vi.fn()} />);
    expect(screen.getByText('14 municípios monitorados')).toBeTruthy();
  });
});
