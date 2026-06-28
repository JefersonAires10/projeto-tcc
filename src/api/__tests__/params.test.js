import { describe, it, expect } from 'vitest';
import { fmtAno, fmtAnoIntervalo, orcParams, licParams, muniParams } from '../params';

describe('fmtAno', () => {
  it('retorna ano seguido de 00 para anos >= 2007', () => {
    expect(fmtAno('2026')).toBe('202600');
    expect(fmtAno(2026)).toBe('202600');
  });

  it('retorna ano com mês para anos entre 2003 e 2006', () => {
    expect(fmtAno('2005', '03')).toBe('200503');
  });

  it('retorna ano como string para anos < 2003', () => {
    expect(fmtAno('2002')).toBe('2002');
  });
});

describe('fmtAnoIntervalo', () => {
  it('retorna intervalo ISO do ano', () => {
    expect(fmtAnoIntervalo('2026')).toBe('2026-01-01_2026-12-31');
  });
});

describe('orcParams', () => {
  it('inclui codigo_municipio quando fornecido', () => {
    const p = orcParams('144', '2026');
    expect(p.codigo_municipio).toBe('144');
    expect(p.exercicio_orcamento).toBe('202600');
  });

  it('omite codigo_municipio quando não fornecido', () => {
    const p = orcParams(null, '2026');
    expect(p.codigo_municipio).toBeUndefined();
  });
});

describe('licParams', () => {
  it('inclui data_inicio e data_fim', () => {
    const p = licParams('144', '2026');
    expect(p.data_inicio).toBe('2026-01-01');
    expect(p.data_fim).toBe('2026-12-31');
  });

  it('inclui codigo_municipio quando fornecido', () => {
    const p = licParams('144', '2026');
    expect(p.codigo_municipio).toBe('144');
  });
});

describe('muniParams', () => {
  it('retorna objeto com codigo_municipio quando fornecido', () => {
    expect(muniParams('144')).toEqual({ codigo_municipio: '144' });
  });

  it('retorna objeto vazio quando não fornecido', () => {
    expect(muniParams(null)).toEqual({});
    expect(muniParams(undefined)).toEqual({});
  });
});
