import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BtnOutline from '../BtnOutline';

describe('BtnOutline', () => {
  it('renderiza children', () => {
    render(<BtnOutline>Clique Aqui</BtnOutline>);
    expect(screen.getByText('Clique Aqui')).toBeTruthy();
  });

  it('chama onClick quando clicado', () => {
    const onClick = vi.fn();
    render(<BtnOutline onClick={onClick}>Ok</BtnOutline>);
    fireEvent.click(screen.getByText('Ok'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('aplica fullWidth quando prop é true', () => {
    const { container } = render(<BtnOutline fullWidth>Full</BtnOutline>);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.style.width).toBe('100%');
  });

  it('altera estilo no mouseEnter e mouseLeave', () => {
    render(<BtnOutline>Hover</BtnOutline>);
    const btn = screen.getByText('Hover');
    fireEvent.mouseEnter(btn);
    expect(btn.style.borderColor).toBe('var(--blue)');
    expect(btn.style.color).toBe('var(--blue)');
    fireEvent.mouseLeave(btn);
    expect(btn.style.borderColor).toBe('var(--border2)');
    expect(btn.style.color).toBe('var(--text2)');
  });
});
