import { cacheGet, cacheSet, inflightGet, inflightSet, getFallback } from './cache';

const BASE = '/api/sim';
const MAX_RETRIES = 2;
let seedData = null;
let seedLoading = false;
let seedPromise = null;

function loadSeed() {
  if (seedData) return Promise.resolve(seedData);
  if (seedLoading) return seedPromise;
  seedLoading = true;
  seedPromise = fetch('/data/seed.json')
    .then(r => r.ok ? r.json() : null)
    .then(data => { seedData = data; seedLoading = false; return data; })
    .catch(() => { seedLoading = false; return null; });
  return seedPromise;
}

function matchSeed(endpoint, params) {
  if (!seedData) return null;
  const epKey = Object.keys(seedData).find(k => k.endsWith(endpoint));
  if (!epKey) return null;
  const seed = seedData[epKey];
  if (!seed) return null;
  const data = seed?.elements ?? (Array.isArray(seed) ? seed : null);
  return data ? { elements: data } : seed;
}

async function doFetch(url, attempt = 0) {
  const res = await fetch(url);
  if (!res.ok) {
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
      return doFetch(url, attempt + 1);
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function get(endpoint, params = {}) {
  const cached = cacheGet(endpoint, params);
  if (cached) return cached;

  const pending = inflightGet(endpoint, params);
  if (pending) return pending;

  const url = BASE + endpoint;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
  const fullUrl = qs ? url + '?' + qs : url;

  const promise = (async () => {
    try {
      const json = await doFetch(fullUrl);
      const data = json?.data ?? json;
      cacheSet(endpoint, params, data);
      return data;
    } catch (err) {
      console.warn(`[TCE] ${endpoint}:`, err.message);
      const fallback = await getFallback(endpoint, params);
      if (fallback != null) return fallback;
      await loadSeed();
      return matchSeed(endpoint, params);
    }
  })();

  inflightSet(endpoint, params, promise);
  return promise;
}

export { BASE, get };
