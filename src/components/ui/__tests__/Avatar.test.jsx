import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('renderiza iniciais do nome completo', () => {
    render(<Avatar name="João Silva" />);
    expect(screen.getByText('JS')).toBeTruthy();
  });

  it('renderiza iniciais de nome único', () => {
    render(<Avatar name="Maria" />);
    expect(screen.getByText('M')).toBeTruthy();
  });

  it('renderiza iniciais de nome com três partes', () => {
    render(<Avatar name="José Antonio Santos" />);
    expect(screen.getByText('JA')).toBeTruthy();
  });

  it('renderiza ? para nome vazio (falsy)', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renderiza ? para nome undefined', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('usa tamanho customizado', () => {
    const { container } = render(<Avatar name="Test" size={48} />);
    const div = container.firstChild;
    expect(div.style.width).toBe('48px');
    expect(div.style.height).toBe('48px');
  });
});
