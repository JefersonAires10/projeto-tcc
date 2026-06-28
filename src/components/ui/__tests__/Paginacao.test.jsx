import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Paginacao from '../Paginacao';

describe('Paginacao', () => {
  it('renderiza botões de navegação', () => {
    render(<Paginacao pagina={1} totalPag={5} onChange={vi.fn()} />);
    expect(screen.getByText('⇤')).toBeTruthy();
    expect(screen.getByText('←')).toBeTruthy();
    expect(screen.getByText('→')).toBeTruthy();
    expect(screen.getByText('⇥')).toBeTruthy();
  });

  it('não renderiza quando totalPag <= 1', () => {
    const { container } = render(<Paginacao pagina={1} totalPag={1} onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('chama onChange ao clicar em número de página', () => {
    const onChange = vi.fn();
    render(<Paginacao pagina={1} totalPag={3} onChange={onChange} />);
    fireEvent.click(screen.getByText('2'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('chama onChange com página anterior', () => {
    const onChange = vi.fn();
    render(<Paginacao pagina={3} totalPag={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('←'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('chama onChange com primeira página', () => {
    const onChange = vi.fn();
    render(<Paginacao pagina={3} totalPag={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('⇤'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('chama onChange com próxima página', () => {
    const onChange = vi.fn();
    render(<Paginacao pagina={2} totalPag={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('→'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('chama onChange com última página', () => {
    const onChange = vi.fn();
    render(<Paginacao pagina={2} totalPag={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('⇥'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('desabilita botões anterior/início na primeira página', () => {
    render(<Paginacao pagina={1} totalPag={3} onChange={vi.fn()} />);
    expect(screen.getByText('⇤')).toBeDisabled();
    expect(screen.getByText('←')).toBeDisabled();
  });

  it('desabilita botões próximo/fim na última página', () => {
    render(<Paginacao pagina={3} totalPag={3} onChange={vi.fn()} />);
    expect(screen.getByText('→')).toBeDisabled();
    expect(screen.getByText('⇥')).toBeDisabled();
  });

  it('mostra elipses quando há muitas páginas', () => {
    const { container } = render(<Paginacao pagina={5} totalPag={10} onChange={vi.fn()} />);
    const ellipses = container.querySelectorAll('span');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it('destaca página ativa', () => {
    render(<Paginacao pagina={2} totalPag={5} onChange={vi.fn()} />);
    const btn2 = screen.getByText('2');
    expect(btn2.style.fontWeight).toBe('700');
  });
});
