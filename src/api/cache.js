import { dbGet, dbSet } from './db';

const TTL = 10 * 60 * 1000;
const mem = new Map();
const inflight = new Map();

function key(endpoint, params) {
  const p = params && Object.keys(params).length ? '?' + JSON.stringify(params) : '';
  return endpoint + p;
}

export function cacheGet(endpoint, params) {
  const k = key(endpoint, params);
  const hit = mem.get(k);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  if (hit) mem.delete(k);
  return null;
}

export function cacheSet(endpoint, params, data) {
  const k = key(endpoint, params);
  mem.set(k, { data, ts: Date.now() });
  dbSet(k, { data, ts: Date.now() });
  try {
    localStorage.setItem('tce:' + k, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore */ }
}

export function inflightGet(endpoint, params) {
  return inflight.get(key(endpoint, params)) || null;
}

export function inflightSet(endpoint, params, promise) {
  const k = key(endpoint, params);
  inflight.set(k, promise);
  promise.finally(() => inflight.delete(k));
}

export async function getFallback(endpoint, params) {
  const k = key(endpoint, params);
  const idb = await dbGet(k);
  if (idb) return idb.data;
  try {
    const raw = localStorage.getItem('tce:' + k);
    if (raw) return JSON.parse(raw).data;
  } catch { /* ignore */ }
  return null;
}
