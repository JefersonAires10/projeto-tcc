import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';

vi.mock('../panels/orcamento', () => ({ default: ({ onAlertCountChange }) => {
  onAlertCountChange?.(0);
  return <div data-testid="panel-orcamento">Orçamento</div>;
}}));
vi.mock('../panels/licitacoes', () => ({ default: () => <div data-testid="panel-licitacoes">Licitações</div> }));
vi.mock('../panels/pessoal', () => ({ default: () => <div data-testid="panel-pessoal">Pessoal</div> }));
vi.mock('../panels/patrimonio', () => ({ default: () => <div data-testid="panel-patrimonio">Patrimônio</div> }));
vi.mock('../panels/comparativo', () => ({ default: () => <div data-testid="panel-comparativo">Comparativo</div> }));
vi.mock('../panels/alertas', () => ({ default: ({ onAlertCountChange }) => {
  onAlertCountChange?.(3);
  return <div data-testid="panel-alertas">Alertas</div>;
}}));

describe('App', () => {
  it('renderiza sidebar com título', () => {
    render(<App />);
    expect(screen.getByText('Portal da Transparência')).toBeTruthy();
    expect(screen.getByText('Sertão Transparente')).toBeTruthy();
  });

  it('inicia com painel orçamentário', () => {
    render(<App />);
    expect(screen.getByTestId('panel-orcamento')).toBeTruthy();
  });

  it('navega entre painéis ao clicar na sidebar', () => {
    render(<App />);
    const pessoalBtn = screen.getAllByText('Radar de Pessoal')[0];
    fireEvent.click(pessoalBtn);
    expect(screen.getByTestId('panel-pessoal')).toBeTruthy();
  });

  it('altera município via header', () => {
    render(<App />);
    const select = screen.getByDisplayValue('QUIXADÁ');
    fireEvent.change(select, { target: { value: '030' } });
    expect(screen.getByDisplayValue('BOA VIAGEM')).toBeTruthy();
  });

  it('dispara refresh ao clicar em Atualizar', () => {
    render(<App />);
    const refreshBtn = screen.getByText('Atualizar');
    fireEvent.click(refreshBtn);
  });
});
