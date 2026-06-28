import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renderiza título e children', () => {
    render(<Card title="Meu Card"><div data-testid="content">conteúdo</div></Card>);
    expect(screen.getByText('Meu Card')).toBeTruthy();
    expect(screen.getByTestId('content')).toBeTruthy();
  });

  it('renderiza sub quando fornecido', () => {
    render(<Card title="Título" sub="Subtítulo"><div /></Card>);
    expect(screen.getByText('Subtítulo')).toBeTruthy();
  });

  it('renderiza apenas children sem título', () => {
    render(<Card><div data-testid="only-child">apenas</div></Card>);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByTestId('only-child')).toBeTruthy();
  });

  it('aplica style customizado', () => {
    render(<Card title="Card" style={{ background: 'red' }}><div /></Card>);
    const card = screen.getByText('Card').closest('div');
    expect(card).toBeTruthy();
  });
});
