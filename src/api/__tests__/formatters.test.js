import { describe, it, expect } from 'vitest';
import { fmt, fmtN, fmtBRL } from '../formatters';

describe('fmt', () => {
  it('formata bilhões', () => {
    expect(fmt(2_500_000_000)).toBe('R$ 2.5B');
  });

  it('formata milhões', () => {
    expect(fmt(1_500_000)).toBe('R$ 1.5M');
  });

  it('formata milhares', () => {
    expect(fmt(2_500)).toBe('R$ 3K');
  });

  it('formata valores menores que mil', () => {
    expect(fmt(500)).toBe('R$ 500');
  });

  it('retorna travessão para null', () => {
    expect(fmt(null)).toBe('–');
  });

  it('retorna travessão para undefined', () => {
    expect(fmt(undefined)).toBe('–');
  });

  it('retorna travessão para NaN', () => {
    expect(fmt(NaN)).toBe('–');
  });

  it('converte string numérica automaticamente', () => {
    expect(fmt('2500')).toBe('R$ 3K');
  });
});

describe('fmtN', () => {
  it('formata número no padrão pt-BR', () => {
    expect(fmtN(1500)).toBe('1.500');
  });

  it('retorna travessão para null', () => {
    expect(fmtN(null)).toBe('–');
  });

  it('retorna travessão para undefined', () => {
    expect(fmtN(undefined)).toBe('–');
  });
});

describe('fmtBRL', () => {
  it('formata valor inteiro', () => {
    const result = fmtBRL(1234);
    expect(result).toContain('1.234');
    expect(result).toContain('R$');
  });

  it('formata valor com centavos', () => {
    const result = fmtBRL(1234.56);
    expect(result).toContain('1.234');
    expect(result).toContain('56');
  });

  it('retorna travessão para null', () => {
    expect(fmtBRL(null)).toBe('–');
  });

  it('retorna travessão para undefined', () => {
    expect(fmtBRL(undefined)).toBe('–');
  });

  it('formata zero', () => {
    expect(fmtBRL(0)).toContain('0,00');
  });
});
