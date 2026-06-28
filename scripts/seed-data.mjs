import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');

const TCE = 'https://api-dados-abertos.tce.ce.gov.br/sim';
const ANO = String(new Date().getFullYear());
const MUNICIPIO = '144';

const ENDPOINTS = [
  '/agentes_publicos_municipais',
  '/folhas_pagamentos',
  '/agentes_publicos_folha',
  '/diarias',
  '/reingressos_agentes_publicos',
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`Seeding data for municipio ${MUNICIPIO}, ano ${ANO}...\n`);

  const seed = { _meta: { generated: new Date().toISOString(), municipio: MUNICIPIO, ano: ANO } };
  const params = `codigo_municipio=${MUNICIPIO}&exercicio_orcamento=${ANO}00&data_referencia_doc=${ANO}01`;

  for (const ep of ENDPOINTS) {
    const url = `${TCE}${ep}?${params}`;
    try {
      const json = await fetchJSON(url);
      seed[ep] = json?.data ?? json;
      console.log(`  ✓ ${ep}`);
    } catch (err) {
      console.warn(`  ✗ ${ep}: ${err.message}`);
      seed[ep] = { elements: [] };
    }
  }

  const out = path.join(ROOT, 'public', 'data', 'seed.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(seed, null, 2));
  console.log(`\n✓ Seed saved (${(Buffer.byteLength(JSON.stringify(seed)) / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
