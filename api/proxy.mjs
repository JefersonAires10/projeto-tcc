const TCE_BASE = 'https://api-dados-abertos.tce.ce.gov.br';

export default async function handler(request) {
  const reqUrl = new URL(request.url);
  const path = reqUrl.pathname.replace(/^\/api\/sim/, '/sim');
  const tceUrl = TCE_BASE + path + reqUrl.search;

  try {
    const apiRes = await fetch(tceUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    const data = await apiRes.json();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });

    return new Response(JSON.stringify(data), {
      status: apiRes.status,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'TCE-CE unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export const config = { runtime: 'edge' };
