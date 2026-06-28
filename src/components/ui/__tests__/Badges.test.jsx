import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, VinculoBadge } from '../Badges';

describe('StatusBadge', () => {
  it('renderiza com variante padrão ok', () => {
    render(<StatusBadge>Ativo</StatusBadge>);
    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('renderiza com variante aberto', () => {
    render(<StatusBadge variant="aberto">Em Andamento</StatusBadge>);
    expect(screen.getByText('Em Andamento')).toBeTruthy();
  });

  it('renderiza com variante cancelado', () => {
    render(<StatusBadge variant="cancelado">Cancelado</StatusBadge>);
    expect(screen.getByText('Cancelado')).toBeTruthy();
  });

  it('renderiza com variante alerta', () => {
    render(<StatusBadge variant="alerta">Alerta</StatusBadge>);
    expect(screen.getByText('Alerta')).toBeTruthy();
  });

  it('renderiza com variante alto', () => {
    render(<StatusBadge variant="alto">Alto Risco</StatusBadge>);
    expect(screen.getByText('Alto Risco')).toBeTruthy();
  });

  it('fallback para ok quando variante é desconhecida', () => {
    render(<StatusBadge variant="inexistente">Fallback</StatusBadge>);
    expect(screen.getByText('Fallback')).toBeTruthy();
  });
});

describe('VinculoBadge', () => {
  it('renderiza EFETIVO', () => {
    render(<VinculoBadge vinculo="EFETIVO" />);
    expect(screen.getByText('EFETIVO')).toBeTruthy();
  });

  it('renderiza COMISSIONADO', () => {
    render(<VinculoBadge vinculo="comissionado" />);
    expect(screen.getByText('COMISSIONADO')).toBeTruthy();
  });

  it('renderiza TEMPORARIO', () => {
    render(<VinculoBadge vinculo="Temporario" />);
    expect(screen.getByText('TEMPORARIO')).toBeTruthy();
  });

  it('default para EFETIVO quando vinculo é undefined', () => {
    render(<VinculoBadge />);
    expect(screen.getByText('EFETIVO')).toBeTruthy();
  });
});
