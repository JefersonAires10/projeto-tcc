/**
 * Script de medição de performance para validação do RNF01.
 * Uso: node tests/performance/medir-carregamento.mjs <url>
 * Exemplo: node tests/performance/medir-carregamento.mjs https://sertao-transparente.vercel.app
 */

const BASE_URL = process.argv[2] || 'http://localhost:4173';

async function medir(url, label) {
  const start = performance.now();
  try {
    const res = await fetch(url);
    await res.json();
    const duration = performance.now() - start;
    console.log(`${label}: ${duration.toFixed(0)}ms [${res.status}]`);
    return duration;
  } catch (err) {
    console.log(`${label}: FALHA [${err.message}]`);
    return null;
  }
}

async function main() {
  console.log(`Medindo performance contra: ${BASE_URL}\n`);

  const endpoints = [
    '/api/sim/agentes_publicos_municipais?codigo_municipio=144&exercicio_orcamento=202600&data_referencia_doc=202601',
    '/api/sim/folhas_pagamentos?codigo_municipio=144&exercicio_orcamento=202600&data_referencia_doc=202601',
    '/api/sim/diarias?codigo_municipio=144&exercicio_orcamento=202600&data_referencia_doc=202601',
    '/api/sim/reingressos_agentes_publicos?codigo_municipio=144&exercicio_orcamento=202600&data_referencia_doc=202601',
  ];

  const resultados = [];
  for (const ep of endpoints) {
    const nome = ep.split('?')[0].split('/').pop();
    const t1 = await medir(BASE_URL + ep, `${nome} (1ª chamada)`);
    const t2 = await medir(BASE_URL + ep, `${nome} (2ª chamada)`);
    resultados.push({ nome, primeira: t1, segunda: t2 });
  }

  console.log('\n--- RESUMO ---');
  for (const r of resultados) {
    const status = r.primeira !== null && r.primeira < 3000 ? 'OK' : 'ACIMA DO LIMITE';
    console.log(`${r.nome}: 1ª=${r.primeira}ms  2ª=${r.segunda}ms  [${status}]`);
  }

  const todasOk = resultados.every(r => r.primeira !== null && r.primeira < 3000);
  console.log(`\nRNF01 (3s): ${todasOk ? 'ATENDIDO' : 'NÃO ATENDIDO'}`);
}

main().catch(console.error);
