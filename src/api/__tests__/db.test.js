import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { dbGet, dbSet } from '../db';

describe('db', () => {
  it('armazena e recupera valores', async () => {
    await dbSet('key1', 'value1');
    const result = await dbGet('key1');
    expect(result).toBe('value1');
  });

  it('retorna null para chave inexistente', async () => {
    const result = await dbGet('inexistente_' + Date.now());
    expect(result).toBeNull();
  });

  it('sobrescreve valores existentes', async () => {
    await dbSet('key_sobrescreve', 'old');
    await dbSet('key_sobrescreve', 'new');
    const result = await dbGet('key_sobrescreve');
    expect(result).toBe('new');
  });

  it('armazena objetos', async () => {
    const obj = { nome: 'João', idade: 30 };
    await dbSet('obj_key', obj);
    const result = await dbGet('obj_key');
    expect(result).toEqual(obj);
  });

  it('armazena arrays', async () => {
    const arr = [1, 2, 3];
    await dbSet('arr_key', arr);
    const result = await dbGet('arr_key');
    expect(result).toEqual(arr);
  });

  it('chaves diferentes não interferem', async () => {
    await dbSet('a_diff', 1);
    await dbSet('b_diff', 2);
    expect(await dbGet('a_diff')).toBe(1);
    expect(await dbGet('b_diff')).toBe(2);
  });
});
