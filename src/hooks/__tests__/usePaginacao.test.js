import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePaginacao from '../usePaginacao';

describe('usePaginacao', () => {
  it('inicia na página 1', () => {
    const { result } = renderHook(() => usePaginacao());
    expect(result.current.pagina).toBe(1);
  });

  it('usa 10 itens por página como padrão', () => {
    const { result } = renderHook(() => usePaginacao());
    expect(result.current.porPagina).toBe(10);
  });

  it('calcula total de páginas corretamente com 25 itens', () => {
    const { result } = renderHook(() => usePaginacao(10));
    const items = Array.from({ length: 25 }, (_, i) => i);
    const calc = result.current.calcular(items);
    expect(calc.totalPag).toBe(3);
    expect(calc.exibidos).toHaveLength(10);
    expect(calc.exibidos[0]).toBe(0);
    expect(calc.exibidos[9]).toBe(9);
  });

  it('retorna todos os itens quando cabe em uma página', () => {
    const { result } = renderHook(() => usePaginacao(10));
    const items = [1, 2, 3];
    const calc = result.current.calcular(items);
    expect(calc.totalPag).toBe(1);
    expect(calc.exibidos).toEqual([1, 2, 3]);
  });

  it('navega para página específica via setPag', () => {
    const { result } = renderHook(() => usePaginacao(10));
    act(() => result.current.setPag(3));
    expect(result.current.pagina).toBe(3);
  });

  it('retorna exibidos da página 2 corretamente', () => {
    const { result } = renderHook(() => usePaginacao(10));
    act(() => result.current.setPag(2));
    const items = Array.from({ length: 25 }, (_, i) => i);
    const calc = result.current.calcular(items);
    expect(calc.pagina).toBe(2);
    expect(calc.exibidos).toHaveLength(10);
    expect(calc.exibidos[0]).toBe(10);
    expect(calc.exibidos[9]).toBe(19);
  });

  it('ajusta página atual se ultrapassar total', () => {
    const { result } = renderHook(() => usePaginacao(10));
    act(() => result.current.setPag(10));
    const items = Array.from({ length: 5 }, (_, i) => i);
    const calc = result.current.calcular(items);
    expect(calc.pagina).toBe(1);
  });

  it('retorna página 1 e lista vazia para array vazio', () => {
    const { result } = renderHook(() => usePaginacao(10));
    const calc = result.current.calcular([]);
    expect(calc.totalPag).toBe(1);
    expect(calc.exibidos).toEqual([]);
  });

  it('retorna página 1 e array vazio para null', () => {
    const { result } = renderHook(() => usePaginacao(10));
    const calc = result.current.calcular(null);
    expect(calc.totalPag).toBe(1);
    expect(calc.exibidos).toEqual([]);
  });
});
