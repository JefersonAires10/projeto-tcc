import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner, Skeleton, PageSkeleton } from '../Loading';

describe('Spinner', () => {
  it('renderiza mensagem padrão', () => {
    render(<Spinner />);
    expect(screen.getByText('Carregando...')).toBeTruthy();
  });

  it('renderiza mensagem customizada', () => {
    render(<Spinner message="Aguarde, carregando dados..." />);
    expect(screen.getByText('Aguarde, carregando dados...')).toBeTruthy();
  });
});

describe('Skeleton', () => {
  it('renderiza com dimensões padrão', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renderiza com largura e altura customizadas', () => {
    const { container } = render(<Skeleton width="50%" height={40} />);
    const el = container.firstChild;
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('40px');
  });

  it('renderiza com borderRadius customizado', () => {
    const { container } = render(<Skeleton borderRadius={4} />);
    const el = container.firstChild;
    expect(el.style.borderRadius).toBe('4px');
  });
});

describe('PageSkeleton', () => {
  it('renderiza com 4 kpis (padrão)', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renderiza com layout 2fr-1fr (padrão)', () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renderiza com layout 1fr-1fr', () => {
    const { container } = render(<PageSkeleton layout="1fr-1fr" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renderiza com layout 1fr', () => {
    const { container } = render(<PageSkeleton layout="1fr" />);
    expect(container.firstChild).toBeTruthy();
  });
});
