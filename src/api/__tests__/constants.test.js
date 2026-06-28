import { describe, it, expect } from 'vitest';
import { MUNICIPIOS_SERTAO, MESES, ANOS } from '../constants';

describe('constants', () => {
  it('MUNICIPIOS_SERTAO tem 14 municípios', () => {
    expect(MUNICIPIOS_SERTAO).toHaveLength(14);
    expect(MUNICIPIOS_SERTAO[0]).toEqual({ codigo: '022', nome: 'BANABUIÚ', geoibge: '2301851' });
    expect(MUNICIPIOS_SERTAO[13]).toEqual({ codigo: '163', nome: 'SOLONÓPOLE', geoibge: '2313005' });
  });

  it('MESES tem 12 meses de Jan a Dez', () => {
    expect(MESES).toHaveLength(12);
    expect(MESES[0]).toBe('Jan');
    expect(MESES[11]).toBe('Dez');
  });

  it('ANOS contém de 2009 a 2026 em ordem decrescente', () => {
    expect(ANOS).toHaveLength(18);
    expect(ANOS[0]).toBe('2026');
    expect(ANOS[17]).toBe('2009');
  });
});
