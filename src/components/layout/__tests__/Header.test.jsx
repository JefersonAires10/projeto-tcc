import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  const defaultProps = {
    activeLabel: 'Painel Orçamentário',
    municipio: '144',
    ano: '2026',
    onMuniChange: vi.fn(),
    onAnoChange: vi.fn(),
    onRefresh: vi.fn(),
  };

  it('renderiza label ativo', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Painel Orçamentário')).toBeTruthy();
  });

  it('renderiza botão Atualizar', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Atualizar')).toBeTruthy();
  });

  it('chama onRefresh ao clicar em Atualizar', () => {
    render(<Header {...defaultProps} />);
    fireEvent.click(screen.getByText('Atualizar'));
    expect(defaultProps.onRefresh).toHaveBeenCalledOnce();
  });

  it('chama onMuniChange ao selecionar município', () => {
    render(<Header {...defaultProps} />);
    const select = screen.getByDisplayValue('QUIXADÁ');
    fireEvent.change(select, { target: { value: '030' } });
    expect(defaultProps.onMuniChange).toHaveBeenCalledWith('030');
  });

  it('chama onAnoChange ao selecionar ano', () => {
    render(<Header {...defaultProps} />);
    const select = screen.getByDisplayValue('2026');
    fireEvent.change(select, { target: { value: '2025' } });
    expect(defaultProps.onAnoChange).toHaveBeenCalledWith('2025');
  });

  it('renderiza select com todos os municípios', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('QUIXADÁ')).toBeTruthy();
    expect(screen.getByText('SOLONÓPOLE')).toBeTruthy();
  });

  it('renderiza select com todos os anos disponíveis', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('2025')).toBeTruthy();
    expect(screen.getByText('2009')).toBeTruthy();
  });
});
