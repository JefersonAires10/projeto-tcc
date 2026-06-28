import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheGet, cacheSet, inflightGet, inflightSet, getFallback } from '../cache';

vi.mock('../db', () => ({
  dbGet: vi.fn(() => Promise.resolve(null)),
  dbSet: vi.fn(() => Promise.resolve()),
}));

describe('cache em memória', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  it('armazena e recupera dados', () => {
    cacheSet('/test', { id: 1 }, { nome: 'João' });
    expect(cacheGet('/test', { id: 1 })).toEqual({ nome: 'João' });
  });

  it('retorna null para chave nunca armazenada', () => {
    expect(cacheGet('/inexistente', {})).toBeNull();
  });

  it('retorna null após expiração do TTL', () => {
    cacheSet('/ep', { p: 1 }, 'dado');
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(cacheGet('/ep', { p: 1 })).toBeNull();
  });

  it('retorna dados dentro do TTL', () => {
    cacheSet('/ep', { p: 1 }, 'dado');
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(cacheGet('/ep', { p: 1 })).toBe('dado');
  });

  it('remove entrada expirada do mapa', () => {
    cacheSet('/ep', {}, 'dado');
    vi.advanceTimersByTime(11 * 60 * 1000);
    cacheGet('/ep', {});
    expect(cacheGet('/ep', {})).toBeNull();
  });
});

describe('deduplicação em voo', () => {
  it('armazena e recupera Promise', () => {
    const p = Promise.resolve('ok');
    inflightSet('/ep', { a: 1 }, p);
    expect(inflightGet('/ep', { a: 1 })).toBe(p);
  });

  it('remove Promise após conclusão', async () => {
    const p = Promise.resolve('ok');
    inflightSet('/ep', {}, p);
    await p;
    await vi.waitFor(() => {
      expect(inflightGet('/ep', {})).toBeNull();
    });
  });

  it('retorna null para chave sem Promise em voo', () => {
    expect(inflightGet('/ep', {})).toBeNull();
  });
});

describe('geração de chave', () => {
  it('diferencia endpoints diferentes com mesmos parâmetros', () => {
    cacheSet('/ep1', { id: 1 }, 'a');
    cacheSet('/ep2', { id: 1 }, 'b');
    expect(cacheGet('/ep1', { id: 1 })).toBe('a');
    expect(cacheGet('/ep2', { id: 1 })).toBe('b');
  });

  it('diferencia parâmetros diferentes no mesmo endpoint', () => {
    cacheSet('/ep', { id: 1 }, 'a');
    cacheSet('/ep', { id: 2 }, 'b');
    expect(cacheGet('/ep', { id: 1 })).toBe('a');
    expect(cacheGet('/ep', { id: 2 })).toBe('b');
  });

  it('trata parâmetros vazios', () => {
    cacheSet('/ep', {}, 'a');
    expect(cacheGet('/ep', {})).toBe('a');
  });
});

describe('fallback localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retorna dados do localStorage quando memória vazia', async () => {
    localStorage.setItem('tce:/ep', JSON.stringify({ data: 'fallback', ts: Date.now() }));
    const result = await getFallback('/ep', {});
    expect(result).toBe('fallback');
  });

  it('retorna null quando não há dados em lugar nenhum', async () => {
    const result = await getFallback('/ep', {});
    expect(result).toBeNull();
  });
});
