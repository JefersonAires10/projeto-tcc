import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from '../client';

vi.mock('../db', () => ({
  dbGet: vi.fn(() => Promise.resolve(null)),
  dbSet: vi.fn(() => Promise.resolve()),
}));

function mockFetchResponse(data, ok = true) {
  return { ok, json: () => Promise.resolve(data) };
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();

  globalThis.fetch = vi.fn((url) => {
    if (url === '/data/seed.json') {
      return Promise.resolve(mockFetchResponse({}));
    }
    return Promise.reject(new Error('unmocked URL: ' + url));
  });
});

describe('client.get', () => {
  it('retorna dados quando API responde com sucesso', async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve(mockFetchResponse({ data: { elements: [{ nome: 'João' }] } }))
    );

    const result = await get('/agentes_publicos_municipais', { codigo_municipio: '144' });
    expect(result).toEqual({ elements: [{ nome: 'João' }] });
  });

  it('usa cache em chamadas repetidas com mesmos parâmetros', async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve(mockFetchResponse({ data: 'valor' }))
    );

    const r1 = await get('/ep', { p: 1 });
    expect(r1).toBe('valor');

    const r2 = await get('/ep', { p: 1 });
    expect(r2).toBe('valor');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('ignora parâmetros vazios na URL', async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve(mockFetchResponse({ data: 'ok' }))
    );

    await get('/ep', { vazio: '', nulo: null, indef: undefined, valido: '1' });
    const calledUrl = vi.mocked(fetch).mock.calls[0][0];
    expect(calledUrl).not.toContain('vazio');
    expect(calledUrl).not.toContain('nulo');
    expect(calledUrl).not.toContain('indef');
    expect(calledUrl).toContain('valido=1');
  });

  it('retorna null quando API falha e fallbacks vazios', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => Promise.reject(new Error('falha')));

    const result = await get('/ep_novo', {});
    expect(result).toBeNull();
  });
});
