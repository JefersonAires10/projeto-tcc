const TCE_API = 'https://api-dados-abertos.tce.ce.gov.br/sim';
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE = isDev ? '/api/sim' : TCE_API;

async function get(endpoint, params = {}) {
  try {
    const url = new URL(BASE + endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.data ?? json;
  } catch (err) {
    console.warn(`[TCE /sim] ${endpoint}:`, err.message);
    return null;
  }
}

export { BASE, get };
